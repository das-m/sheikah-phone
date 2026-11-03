// Pacing of the boot screen. Pure, so it is testable without a browser.
// The show starts black. The frame of the slate draws in first, once its art is loaded and decoded (so it never
// flickers in), the glow blinks on, then the screen turns on and the logo appears on it. The show has a floor
// (`minAfterLogoMs`, so it never flashes by) and a ceiling (`maxMs`, so a slow connection never holds the player
// back); in between it waits for the real preloading.

export type PreloadGroup = 'fonts' | 'images' | 'audio' | 'modules'

export interface GroupProgress {
  done: number
  total: number
}

export interface BootTiming {
  /** The screen stays black at least this long before the frame draws in. */
  frameAtMs: number
  /** The frame draws in here at the latest, even if its art is still loading. */
  frameWaitMaxMs: number
  /** The screen turns on this long after the frame started to draw in (the glow has finished blinking by then). */
  screenAfterFrameMs: number
  /** The logo appears this long after the screen turned on. */
  logoAfterScreenMs: number
  /** Earliest end of the boot, counted from the logo's ignition. */
  minAfterLogoMs: number
  /** Latest end of the boot, whatever is still loading (it keeps loading in the background). */
  maxMs: number
}

export const BOOT_TIMING: BootTiming = {
  frameAtMs: 900,
  frameWaitMaxMs: 3000,
  screenAfterFrameMs: 2700,
  logoAfterScreenMs: 1000,
  minAfterLogoMs: 2000,
  maxMs: 10000
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

/** Time to draw the frame in: after the black hold, once its art is ready (or the wait has run out). */
export function isFrameDue(elapsedMs: number, frameReady: boolean, timing = BOOT_TIMING): boolean {
  return elapsedMs >= timing.frameAtMs && (frameReady || elapsedMs >= timing.frameWaitMaxMs)
}

/** Time to turn the screen on; `frameAtMs` is when the frame started to draw in (null: not yet). */
export function isScreenDue(
  elapsedMs: number,
  frameAtMs: number | null,
  timing = BOOT_TIMING
): boolean {
  return frameAtMs !== null && elapsedMs >= frameAtMs + timing.screenAfterFrameMs
}

/** Time to show the logo; `screenAtMs` is when the screen turned on (null: not yet). */
export function isLogoDue(
  elapsedMs: number,
  screenAtMs: number | null,
  timing = BOOT_TIMING
): boolean {
  return screenAtMs !== null && elapsedMs >= screenAtMs + timing.logoAfterScreenMs
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
