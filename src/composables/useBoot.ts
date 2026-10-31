import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  BOOT_TIMING,
  BOOT_TIMING_REDUCED,
  isBootDone,
  shownProgress,
  workFraction,
  type GroupProgress,
  type PreloadGroup
} from '@/lib/boot'
import { createPreloadTasks, runPreload } from '@/lib/preload'

/**
 * Drives the boot screen: a clock for the show, and the real preloading the bar reports on.
 * Stops its frame loop on unmount, and when the boot is done or skipped.
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
  const isFinished = ref(false)

  const work = computed(() => workFraction(groups))
  const progress = computed(() =>
    isFinished.value ? 1 : shownProgress(elapsed.value, work.value, timing)
  )

  let frame = 0
  let startedAt = 0

  function tick(now: number) {
    elapsed.value = Math.max(0, now - startedAt)
    if (isBootDone(elapsed.value, work.value, timing)) {
      isFinished.value = true
      return
    }
    frame = requestAnimationFrame(tick)
  }

  /** Ends the show early. The preloading goes on in the background. */
  function skip() {
    if (isFinished.value || elapsed.value < timing.skipAfterMs) return
    cancelAnimationFrame(frame)
    isFinished.value = true
  }

  onMounted(() => {
    startedAt = performance.now()
    frame = requestAnimationFrame(tick)
    void runPreload(tasks, (group) => (groups[group].done += 1))
  })

  onUnmounted(() => cancelAnimationFrame(frame))

  return { progress, isFinished, skip }
}
