export interface Point {
  x: number
  y: number
}

/** The four corners of a code in its own orientation: top left, top right, bottom right, bottom left. */
export type Quad = [Point, Point, Point, Point]

export interface Size {
  width: number
  height: number
}

/** A code as the detector sees it, with its corners in video pixels. */
export interface ScanDetection {
  value: string
  corners: Quad
}

/** The payload is the bare target id; stray whitespace (a typed id, a sloppy print) is not part of it. */
export function normalizeCode(raw: string): string {
  return raw.trim()
}

export interface CoverMap {
  scale: number
  offsetX: number
  offsetY: number
}

/** How a video of size `video` lands in a box of size `box` with `object-fit: cover`: scaled to fill, centered, cropped. */
export function coverMap(video: Size, box: Size): CoverMap {
  const scale = Math.max(box.width / video.width, box.height / video.height)
  return {
    scale,
    offsetX: (box.width - video.width * scale) / 2,
    offsetY: (box.height - video.height * scale) / 2
  }
}

export function mapQuad(quad: Quad, map: CoverMap): Quad {
  const [a, b, c, d] = quad.map((p) => ({
    x: p.x * map.scale + map.offsetX,
    y: p.y * map.scale + map.offsetY
  }))
  return [a, b, c, d]
}

export function quadCenter(quad: Quad): Point {
  return {
    x: (quad[0].x + quad[1].x + quad[2].x + quad[3].x) / 4,
    y: (quad[0].y + quad[1].y + quad[2].y + quad[3].y) / 4
  }
}

/** The quad grown (`factor` > 1) or shrunk about its center: a frame that sits around the code instead of on it. */
export function scaleQuad(quad: Quad, factor: number): Quad {
  const c = quadCenter(quad)
  const [a, b, d, e] = quad.map((p) => ({
    x: c.x + (p.x - c.x) * factor,
    y: c.y + (p.y - c.y) * factor
  }))
  return [a, b, d, e]
}

/** Area of a quad (shoelace), to tell the nearest of several codes apart. */
export function quadArea(quad: Quad): number {
  let sum = 0
  for (let i = 0; i < 4; i++) {
    const p = quad[i]
    const q = quad[(i + 1) % 4]
    sum += p.x * q.y - q.x * p.y
  }
  return Math.abs(sum) / 2
}

/**
 * The detection the scanner follows. Phase one follows a single code: the one already followed (`current`) while it is
 * still in view, otherwise the largest (= nearest). Without that stickiness two codes of about the same size would
 * trade places with every reading.
 * TODO(multi): follow all of them, keyed by `value` (the id is the identity, no association needed).
 */
export function pickDetection(
  detections: ScanDetection[],
  current: string | null = null
): ScanDetection | null {
  const followed = current === null ? undefined : detections.find((d) => d.value === current)
  if (followed) return followed
  let best: ScanDetection | null = null
  for (const d of detections) if (!best || quadArea(d.corners) > quadArea(best.corners)) best = d
  return best
}

/** Counts failures in a row: `fail()` is true once there have been `limit` of them, a success (`ok()`) starts over. */
export function createFailureCounter(limit: number) {
  let count = 0
  return {
    fail(): boolean {
      count++
      return count >= limit
    },
    ok() {
      count = 0
    }
  }
}

/**
 * CSS `matrix3d` that maps a `size` x `size` box (transform-origin `0 0`) onto `quad`, perspective included, so an
 * element lies on the code with its skew and rotation. Null when the quad is degenerate (collinear corners).
 */
export function homographyMatrix3d(quad: Quad, size = 1): number[] | null {
  const [p0, p1, p2, p3] = quad
  const sx = p0.x - p1.x + p2.x - p3.x
  const sy = p0.y - p1.y + p2.y - p3.y
  const dx1 = p1.x - p2.x
  const dx2 = p3.x - p2.x
  const dy1 = p1.y - p2.y
  const dy2 = p3.y - p2.y
  const den = dx1 * dy2 - dx2 * dy1
  if (Math.abs(den) < 1e-9) return null
  // Unit square -> quad, x' = (a u + b v + c) / (g u + h v + 1), y' = (d u + e v + f) / (g u + h v + 1)
  const g = (sx * dy2 - dx2 * sy) / den
  const h = (dx1 * sy - sx * dy1) / den
  const a = p1.x - p0.x + g * p1.x
  const b = p3.x - p0.x + h * p3.x
  const d = p1.y - p0.y + g * p1.y
  const e = p3.y - p0.y + h * p3.y
  // column-major; u = x / size, v = y / size
  return [
    a / size,
    d / size,
    0,
    g / size,
    b / size,
    e / size,
    0,
    h / size,
    0,
    0,
    1,
    0,
    p0.x,
    p0.y,
    0,
    1
  ]
}

export interface TrackerOptions {
  /** Consecutive readings a code must be seen in before it counts as confirmed. */
  frames: number
  /** How long a code that is no longer detected stays on screen before it is dropped. */
  holdMs: number
  /** Time constant of the corner smoothing: the shown corners cover ~63% of the way to the detected ones in this time. */
  smoothingMs: number
}

export const defaultTrackerOptions: TrackerOptions = {
  frames: 2,
  holdMs: 300,
  smoothingMs: 70
}

export interface TrackedCode {
  value: string
  /** Smoothed corners, in the coordinates the detection was fed in. */
  corners: Quad
  confirmed: boolean
}

/**
 * Follows one code across detector readings. `update` takes every reading (which comes at the detector's pace),
 * `step` is called each animation frame and returns the code as it should be drawn now: smoothed, and kept for a
 * moment when a reading misses it. Detections jitter and the detector runs slower than the screen refreshes.
 * TODO(multi): keep one such state per value.
 */
export function createTracker(options: Partial<TrackerOptions> = {}) {
  const { frames, holdMs, smoothingMs } = { ...defaultTrackerOptions, ...options }
  let value: string | null = null
  let target: Quad | null = null
  let shown: Quad | null = null
  let lastSeen = 0
  let lastStep = 0
  let streak = 0
  let confirmed = false

  function clear() {
    value = target = shown = null
    streak = 0
    confirmed = false
  }

  return {
    /** The value of the code being followed, null when none. */
    get value(): string | null {
      return value
    },
    /** A reading: the code in view (`corners` in the same coordinates every time), or null when nothing was seen. */
    update(detection: ScanDetection | null, timeMs: number) {
      if (!detection) {
        // Flicker must not confirm a code, but a confirmed one stays until it is dropped.
        streak = 0
        return
      }
      if (detection.value !== value) {
        clear()
        value = detection.value
        shown = detection.corners
        lastStep = timeMs
      }
      target = detection.corners
      lastSeen = timeMs
      streak++
      if (streak >= frames) confirmed = true
    },
    /** The code to draw at `timeMs`, or null when none is being followed. */
    step(timeMs: number): TrackedCode | null {
      if (value === null || target === null || shown === null) return null
      if (timeMs - lastSeen > holdMs) {
        clear()
        return null
      }
      const alpha = 1 - Math.exp(-Math.max(0, timeMs - lastStep) / smoothingMs)
      lastStep = timeMs
      const goal = target
      const [a, b, c, d] = shown.map((p, i) => ({
        x: p.x + (goal[i].x - p.x) * alpha,
        y: p.y + (goal[i].y - p.y) * alpha
      }))
      shown = [a, b, c, d]
      return { value, corners: shown, confirmed }
    },
    reset: clear
  }
}
