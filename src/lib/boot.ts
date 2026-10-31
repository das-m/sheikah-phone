// Pacing of the boot screen. Pure, so it is testable without a browser.
// The show has a floor (`minMs`, so it never flashes by) and a ceiling (`maxMs`, so a slow connection never
// holds the player back), and in between it waits for the real preloading to finish.

export type PreloadGroup = 'fonts' | 'images' | 'audio' | 'modules'

export interface GroupProgress {
  done: number
  total: number
}

export interface BootTiming {
  /** The bar starts to fill (the logo has ignited by then). */
  barStartMs: number
  /** The bar is full at the earliest here, however fast the loading is. */
  barEndMs: number
  /** Earliest end of the boot. */
  minMs: number
  /** Latest end of the boot, whatever is still loading (it keeps loading in the background). */
  maxMs: number
  /** From here on a tap skips the rest. */
  skipAfterMs: number
}

export const BOOT_TIMING: BootTiming = {
  barStartMs: 1000,
  barEndMs: 5000,
  minMs: 6000,
  maxMs: 10000,
  skipAfterMs: 2000
}

/** For `prefers-reduced-motion`: the same steps, without the wait. */
export const BOOT_TIMING_REDUCED: BootTiming = {
  barStartMs: 0,
  barEndMs: 800,
  minMs: 1500,
  maxMs: 4000,
  skipAfterMs: 0
}

/** How much of the bar each group of work is worth: the images are many, the app chunks are heavy. */
export const WORK_WEIGHTS: Record<PreloadGroup, number> = {
  fonts: 0.1,
  images: 0.4,
  audio: 0.1,
  modules: 0.4
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Share of the real work that is done, 0..1. A group without work counts as done. */
export function workFraction(
  groups: Record<PreloadGroup, GroupProgress>,
  weights: Record<PreloadGroup, number> = WORK_WEIGHTS
): number {
  let done = 0
  let sum = 0
  for (const group of Object.keys(weights) as PreloadGroup[]) {
    const { done: d, total } = groups[group]
    done += weights[group] * (total > 0 ? clamp01(d / total) : 1)
    sum += weights[group]
  }
  return sum > 0 ? done / sum : 1
}

/** The part of the bar that is pure show: how far it may be at this time. */
export function timeProgress(elapsedMs: number, timing = BOOT_TIMING): number {
  return clamp01((elapsedMs - timing.barStartMs) / (timing.barEndMs - timing.barStartMs))
}

/** The bar: never ahead of the real work, and never ahead of the show. */
export function shownProgress(elapsedMs: number, work: number, timing = BOOT_TIMING): number {
  if (elapsedMs >= timing.maxMs) return 1
  return Math.min(clamp01(work), timeProgress(elapsedMs, timing))
}

export function isBootDone(elapsedMs: number, work: number, timing = BOOT_TIMING): boolean {
  return elapsedMs >= timing.maxMs || (elapsedMs >= timing.minMs && work >= 1)
}
