import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  BOOT_TIMING,
  BOOT_TIMING_REDUCED,
  isBootDone,
  isFrameDue,
  isLogoDue,
  workFraction,
  type GroupProgress,
  type PreloadGroup
} from '@/lib/boot'
import { createPreloadTasks, preloadCritical, runPreload } from '@/lib/preload'

/**
 * Drives the boot screen: a clock for the show (black, then the logo, then the frame) and the real preloading
 * it waits for. Stops its frame loop on unmount, and when the boot is done or skipped.
 */
export function useBoot() {
  const timing = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? BOOT_TIMING_REDUCED
    : BOOT_TIMING

  const tasks = createPreloadTasks(useRouter())
  const groups = reactive<Record<PreloadGroup, GroupProgress>>({
    fonts: { done: 0, total: 0 },
    images: { done: 0, total: 0 },
    audio: { done: 0, total: 0 },
    modules: { done: 0, total: 0 }
  })
  for (const task of tasks) groups[task.group].total += 1

  const elapsed = ref(0)
  const isLogoOn = ref(false)
  const isFrameOn = ref(false)
  const isFinished = ref(false)

  const work = computed(() => workFraction(groups))

  let frame = 0
  let startedAt = 0
  let logoAt: number | null = null
  let isLogoReady = false

  function tick(now: number) {
    elapsed.value = Math.max(0, now - startedAt)

    if (logoAt === null && isLogoDue(elapsed.value, isLogoReady, timing)) {
      logoAt = elapsed.value
      isLogoOn.value = true
    }
    if (!isFrameOn.value && isFrameDue(elapsed.value, logoAt, timing)) isFrameOn.value = true

    if (isBootDone(elapsed.value, logoAt, work.value, timing)) {
      isLogoOn.value = false
      isFrameOn.value = true
      isFinished.value = true
      return
    }
    frame = requestAnimationFrame(tick)
  }

  /** Ends the show early. The preloading goes on in the background. */
  function skip() {
    if (isFinished.value || elapsed.value < timing.skipAfterMs) return
    cancelAnimationFrame(frame)
    isLogoOn.value = false
    isFrameOn.value = true
    isFinished.value = true
  }

  onMounted(() => {
    startedAt = performance.now()
    frame = requestAnimationFrame(tick)
    void preloadCritical().then(() => (isLogoReady = true))
    void runPreload(tasks, (group) => (groups[group].done += 1))
  })

  onUnmounted(() => cancelAnimationFrame(frame))

  return { isLogoOn, isFrameOn, isFinished, skip }
}
