import { onUnmounted, watch, type Ref } from 'vue'

import { normalizeCode, type Point, type Quad, type ScanDetection } from '@/lib/scan'

/** The jsQR fallback is pure JS and costs real CPU: it runs at most this often. The native detector paces itself. */
const FALLBACK_INTERVAL_MS = 150
/** Longest edge of the frame handed to jsQR, in pixels. */
const FALLBACK_MAX_EDGE = 640

// Not in lib.dom yet. Chrome on Android ships it, with every code in the frame in one call.
interface DetectedBarcodeLike {
  rawValue: string
  boundingBox: { x: number; y: number; width: number; height: number }
  cornerPoints: Point[]
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcodeLike[]>
}
declare const BarcodeDetector:
  (new (options: { formats: string[] }) => BarcodeDetectorLike) | undefined

/** What the scanner saw last. Plain object, not reactive: it is read from an animation frame loop (`seq` tells new readings). */
export interface ScanState {
  /** Counts readings, also the ones that found nothing. */
  seq: number
  /** The codes of the latest reading, corners in video pixels. */
  detections: ScanDetection[]
}

/** The detector reports corners in the code's own order; fall back to the bounding box without them. */
function cornersOf(code: DetectedBarcodeLike): Quad | null {
  if (code.cornerPoints?.length === 4) {
    const [a, b, c, d] = code.cornerPoints.map((p) => ({ x: p.x, y: p.y }))
    return [a, b, c, d]
  }
  const { x, y, width, height } = code.boundingBox ?? {}
  if (width === undefined || height === undefined) return null
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height }
  ]
}

/**
 * Looks for QR codes in `videoEl` while `active` is true and keeps the latest reading in the returned `state`.
 * Native `BarcodeDetector` where it exists (Android Chrome), jsQR otherwise (desktop browsers, loaded on demand).
 * It reads the raw video frames, so CSS filters on the video do not affect it. The list holds every code the detector
 * returns; the jsQR fallback finds one at most.
 */
export function useCodeScanner(videoEl: Ref<HTMLVideoElement | null>, active: Ref<boolean>) {
  const state: ScanState = { seq: 0, detections: [] }

  let isRunning = false
  // Bumped on every start and stop, so a read that was in flight across one of them is recognized and dropped.
  let generation = 0
  let handle: number | null = null
  let handleVideo: HTMLVideoElement | null = null
  let lastRun = -Infinity
  let detector: BarcodeDetectorLike | null = null
  let isNativeBroken = false
  let canvas: HTMLCanvasElement | null = null

  function publish(detections: ScanDetection[]) {
    state.detections = detections
    state.seq++
  }

  function getNativeDetector(): BarcodeDetectorLike | null {
    if (detector || isNativeBroken || typeof BarcodeDetector === 'undefined') return detector
    try {
      detector = new BarcodeDetector({ formats: ['qr_code'] })
    } catch {
      // This browser's detector has no QR support: use the fallback from now on.
      isNativeBroken = true
    }
    return detector
  }

  async function readNative(
    native: BarcodeDetectorLike,
    video: HTMLVideoElement
  ): Promise<ScanDetection[]> {
    const found = await native.detect(video)
    return found.flatMap((code) => {
      const corners = cornersOf(code)
      const value = normalizeCode(code.rawValue)
      return corners && value ? [{ value, corners }] : []
    })
  }

  async function readFallback(video: HTMLVideoElement): Promise<ScanDetection[]> {
    const { default: jsQR } = await import('jsqr')
    const scale = Math.min(1, FALLBACK_MAX_EDGE / Math.max(video.videoWidth, video.videoHeight))
    canvas ??= document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return []
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const image = context.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(image.data, image.width, image.height)
    const value = code ? normalizeCode(code.data) : ''
    if (!code || !value) return []
    const {
      topLeftCorner: a,
      topRightCorner: b,
      bottomRightCorner: c,
      bottomLeftCorner: d
    } = code.location
    const corners = [a, b, c, d].map((p) => ({ x: p.x / scale, y: p.y / scale })) as Quad
    return [{ value, corners }]
  }

  function read(video: HTMLVideoElement): Promise<ScanDetection[]> {
    const native = getNativeDetector()
    return native ? readNative(native, video) : readFallback(video)
  }

  function schedule() {
    const video = videoEl.value
    if (!isRunning || !video) return
    handleVideo = video
    // A new camera frame is the earliest moment there is anything new to read.
    handle =
      'requestVideoFrameCallback' in video
        ? video.requestVideoFrameCallback(onFrame)
        : requestAnimationFrame(onFrame)
  }

  async function onFrame() {
    handle = null
    const run = generation
    const video = videoEl.value
    const now = performance.now()
    const isNative = typeof BarcodeDetector !== 'undefined' && !isNativeBroken
    const isDue = isNative || now - lastRun >= FALLBACK_INTERVAL_MS
    // The video has no frame yet (still starting), or the fallback is not due again.
    if (
      video &&
      isDue &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth
    ) {
      lastRun = now
      let detections: ScanDetection[] = []
      try {
        detections = await read(video)
      } catch {
        // A failed frame is the same as no code in it.
      }
      // Switched off (and maybe on again, with its own loop) while this frame was being read.
      if (run !== generation) return
      publish(detections)
    }
    schedule()
  }

  function start() {
    if (isRunning) return
    isRunning = true
    generation++
    schedule()
  }

  function stop() {
    isRunning = false
    generation++
    if (handle !== null) {
      if (handleVideo && 'cancelVideoFrameCallback' in handleVideo)
        handleVideo.cancelVideoFrameCallback(handle)
      else cancelAnimationFrame(handle)
    }
    handle = null
    handleVideo = null
    canvas = null
    if (state.detections.length > 0) publish([])
  }

  // The video element appears after setup, so it counts as a condition as well.
  watch(
    () => active.value && videoEl.value !== null,
    (isOn) => {
      if (isOn) start()
      else stop()
    },
    { immediate: true }
  )

  onUnmounted(stop)

  return state
}
