import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  isBootDone,
  isFrameDue,
  isLogoDue,
  isScreenDue,
  workFraction,
  type GroupProgress,
  type PreloadGroup
} from '@/lib/boot'
import { createPreloadTasks, preloadCritical, runPreload } from '@/lib/preload'

/**
 * Drives the boot screen: a clock for the show (black, then the frame, then the screen, then the logo) and the real preloading
 * it waits for. Stops its frame loop on unmount, and when the boot is done.
 */
export function useBoot() {
  const tasks = createPreloadTasks(useRouter())
  const groups = reactive<Record<PreloadGroup, GroupProgress>>({
    fonts: { done: 0, total: 0 },
    images: { done: 0, total: 0 },
    audio: { done: 0, total: 0 },
    modules: { done: 0, total: 0 }
  })
  for (const task of tasks) groups[task.group].total += 1

  const elapsed = ref(0)
  const isScreenOn = ref(false)
  const isLogoOn = ref(false)
  const isFrameOn = ref(false)
  const isFinished = ref(false)

  const work = computed(() => workFraction(groups))

  let frame = 0
  let startedAt = 0
  let frameAt: number | null = null
  let screenAt: number | null = null
  let logoAt: number | null = null
  let isArtReady = false

  function tick(now: number) {
    elapsed.value = Math.max(0, now - startedAt)

    if (frameAt === null && isFrameDue(elapsed.value, isArtReady)) {
      frameAt = elapsed.value
      isFrameOn.value = true
    }
    if (screenAt === null && isScreenDue(elapsed.value, frameAt)) {
      screenAt = elapsed.value
      isScreenOn.value = true
    }
    if (logoAt === null && isLogoDue(elapsed.value, screenAt)) {
      logoAt = elapsed.value
      isLogoOn.value = true
    }

    if (isBootDone(elapsed.value, logoAt, work.value)) {
      isLogoOn.value = false
      isScreenOn.value = true
      isFrameOn.value = true
      isFinished.value = true
      return
    }
    frame = requestAnimationFrame(tick)
  }

  onMounted(() => {
    startedAt = performance.now()
    frame = requestAnimationFrame(tick)
    void preloadCritical().then(() => (isArtReady = true))
    void runPreload(tasks, (group) => (groups[group].done += 1))
  })

  onUnmounted(() => cancelAnimationFrame(frame))

  return { isLogoOn, isScreenOn, isFrameOn, isFinished }
}
