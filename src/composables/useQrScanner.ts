import { onUnmounted, ref, watch, type Ref } from 'vue'
import jsQR from 'jsqr'

import { createConfirmer } from '@/lib/lens'

/** Frames per second the video is checked at. QR codes need no more, and it spares the battery. */
const SCAN_INTERVAL_MS = 250
/** Longest edge of the frame handed to the jsQR fallback: it is pure JS, so smaller is faster. */
const FALLBACK_MAX_EDGE = 640

// Not in lib.dom yet. Chrome on Android ships it.
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>
}
declare const BarcodeDetector:
  (new (options: { formats: string[] }) => BarcodeDetectorLike) | undefined

/**
 * Scans `videoEl` for QR codes while `active` is true and calls `onCode` once per confirmed code.
 * Uses the native BarcodeDetector where it exists, jsQR otherwise (desktop browsers).
 */
export function useQrScanner(
  videoEl: Ref<HTMLVideoElement | null>,
  active: Ref<boolean>,
  onCode: (raw: string) => void
) {
  /** The raw code currently in view, `null` when none. Unconfirmed, for UI hints. */
  const inView = ref<string | null>(null)

  const confirmer = createConfirmer()
  let timer: ReturnType<typeof setInterval> | null = null
  let isBusy = false
  let detector: BarcodeDetectorLike | null = null
  let canvas: HTMLCanvasElement | null = null

  async function read(video: HTMLVideoElement): Promise<string | null> {
    if (typeof BarcodeDetector !== 'undefined') {
      detector ??= new BarcodeDetector({ formats: ['qr_code'] })
      const found = await detector.detect(video)
      return found[0]?.rawValue ?? null
    }
    const scale = Math.min(1, FALLBACK_MAX_EDGE / Math.max(video.videoWidth, video.videoHeight))
    canvas ??= document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const image = context.getImageData(0, 0, canvas.width, canvas.height)
    return jsQR(image.data, image.width, image.height)?.data ?? null
  }

  async function scan() {
    const video = videoEl.value
    // The video has no frame yet (still starting), or the previous scan is still running.
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || isBusy) return
    isBusy = true
    try {
      const raw = await read(video)
      inView.value = raw
      const confirmed = confirmer.push(raw, performance.now())
      if (confirmed) onCode(confirmed)
    } catch {
      // A failed frame is the same as no code in it.
      inView.value = null
      confirmer.push(null, performance.now())
    } finally {
      isBusy = false
    }
  }

  function stop() {
    if (timer !== null) clearInterval(timer)
    timer = null
    confirmer.reset()
    inView.value = null
    canvas = null
  }

  watch(
    active,
    (isActive) => {
      if (isActive && timer === null) timer = setInterval(scan, SCAN_INTERVAL_MS)
      else if (!isActive) stop()
    },
    { immediate: true }
  )

  onUnmounted(stop)

  return { inView }
}
