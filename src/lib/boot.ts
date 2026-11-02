// Pacing of the boot screen. Pure, so it is testable without a browser.
// The show starts black. The logo ignites once its art is loaded and decoded (so it never flickers in), the frame
// of the slate draws in after it, and the show has a floor (`minAfterLogoMs`, so it never flashes by) and a ceiling
// (`maxMs`, so a slow connection never holds the player back); in between it waits for the real preloading.

export type PreloadGroup = 'fonts' | 'images' | 'audio' | 'modules'

export interface GroupProgress {
  done: number
  total: number
}

export interface BootTiming {
  /** The screen stays black at least this long before the logo ignites. */
  logoAtMs: number
  /** The logo ignites here at the latest, even if its art is still loading. */
  logoWaitMaxMs: number
  /** The frame starts to draw in this long after the logo ignited (the eye has settled by then). */
  frameAfterLogoMs: number
  /** Earliest end of the boot, counted from the logo's ignition. */
  minAfterLogoMs: number
  /** Latest end of the boot, whatever is still loading (it keeps loading in the background). */
  maxMs: number
  /** From here on a tap skips the rest. */
  skipAfterMs: number
}

export const BOOT_TIMING: BootTiming = {
  logoAtMs: 900,
  logoWaitMaxMs: 3000,
  frameAfterLogoMs: 1800,
  minAfterLogoMs: 5000,
  maxMs: 10000,
  skipAfterMs: 2500
}

/** For `prefers-reduced-motion`: the same steps, without the wait. */
export const BOOT_TIMING_REDUCED: BootTiming = {
  logoAtMs: 0,
  logoWaitMaxMs: 1500,
  frameAfterLogoMs: 300,
  minAfterLogoMs: 1000,
  maxMs: 4000,
  skipAfterMs: 0
}

/** How much of the real work each group is worth: the images are many, the app chunks are heavy. */
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

/** Time to ignite the logo: after the black hold, once its art is ready (or the wait has run out). */
export function isLogoDue(elapsedMs: number, logoReady: boolean, timing = BOOT_TIMING): boolean {
  return elapsedMs >= timing.logoAtMs && (logoReady || elapsedMs >= timing.logoWaitMaxMs)
}

/** Time to draw the frame in; `logoAtMs` is when the logo ignited (null: not yet). */
export function isFrameDue(
  elapsedMs: number,
  logoAtMs: number | null,
  timing = BOOT_TIMING
): boolean {
  return logoAtMs !== null && elapsedMs >= logoAtMs + timing.frameAfterLogoMs
}

export function isBootDone(
  elapsedMs: number,
  logoAtMs: number | null,
  work: number,
  timing = BOOT_TIMING
): boolean {
  if (elapsedMs >= timing.maxMs) return true
  return logoAtMs !== null && elapsedMs >= logoAtMs + timing.minAfterLogoMs && work >= 1
}
