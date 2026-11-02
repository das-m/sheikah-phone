<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import type { ScanState } from '@/composables/useCodeScanner'
import { aroundCode, findTarget, type ScanTarget } from '@/game/scanTargets'
import {
  boxQuad,
  coverMap,
  createTracker,
  homographyMatrix3d,
  isInsideCircle,
  mapQuad,
  pickDetection,
  quadCenter
} from '@/lib/scan'

/** Size of the frame element in CSS px, before the matrix maps it onto the code. */
const FRAME_SIZE = 100
/** How long a recognised code must be held in view before it opens by itself (the lens ring fills up meanwhile). */
const HOLD_MS = 3000

const props = defineProps<{
  video: HTMLVideoElement | null
  scan: ScanState
  /** Scanning rests (the modal is open): the empty readings it publishes then do not mean the code left the view. */
  paused?: boolean
  /**
   * The round view the camera is shown through (the lens): only codes whose center is inside it count. The hold
   * progress is written to it as `--hold` (0..1), for the lens ring to draw.
   */
  region?: HTMLElement | null
}>()

const emit = defineEmits<{
  /** A code was recognised (once per time it comes into view). */
  confirm: [target: ScanTarget]
  /** The recognised code is gone (out of view, or dropped). */
  lose: []
  /** A recognised code was held in view for `HOLD_MS`. */
  open: [target: ScanTarget]
}>()

const rootEl = ref<HTMLElement | null>(null)
const frameEl = ref<HTMLElement | null>(null)
const isConfirmed = ref(false)

const tracker = createTracker()
let seenSeq = -1
let frame = 0
// A code that opened does not open again until it was out of view: scanning rests under the modal, so a code still
// held when it closes would otherwise open it over and over. A different code is not that code: it opens normally.
let isArmed = true
let openedValue: string | null = null

// The modal opened (by the hold, or by a tap on the name): the code still in view must not open it again afterwards.
watch(
  () => props.paused,
  (paused) => {
    if (paused) {
      isArmed = false
      openedValue = tracker.value
    }
  }
)

function setHold(value: number) {
  props.region?.style.setProperty('--hold', value.toFixed(3))
}

function hide() {
  if (frameEl.value) frameEl.value.style.visibility = 'hidden'
  setHold(0)
  if (isConfirmed.value) {
    isConfirmed.value = false
    emit('lose')
  }
}

/** The lens as a circle in the overlay's px (and the video's mapping to them), or null when the view is not round. */
function lensCircle(root: HTMLElement, video: HTMLVideoElement) {
  const region = props.region
  if (!region) return null
  const rect = region.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()
  return {
    map: coverMap(
      { width: video.videoWidth, height: video.videoHeight },
      { width: root.clientWidth, height: root.clientHeight }
    ),
    circle: {
      x: rect.left - rootRect.left + rect.width / 2,
      y: rect.top - rootRect.top + rect.height / 2,
      r: Math.min(rect.width, rect.height) / 2
    }
  }
}

function tick(now: number) {
  frame = requestAnimationFrame(tick)
  const root = rootEl.value
  const frameNode = frameEl.value
  const video = props.video
  if (!root || !frameNode || !video?.videoWidth) return hide()

  if (props.scan.seq !== seenSeq) {
    seenSeq = props.scan.seq
    // Codes that are not ours (a URL, a foreign QR) get no overlay. TODO(multi): follow every known code.
    // A code outside the lens is not seen by the player, so it must not fill the hold ring or open unseen.
    const lens = lensCircle(root, video)
    const known = props.scan.detections.filter(
      (d) =>
        findTarget(d.value) &&
        (!lens || isInsideCircle(quadCenter(mapQuad(d.corners, lens.map)), lens.circle))
    )
    tracker.update(pickDetection(known, tracker.value), now)
    // The code that opened is out of view (alone, or replaced by another): the next one may open.
    if (!props.paused && !known.some((d) => d.value === openedValue)) isArmed = true
  }
  const tracked = tracker.step(now, aroundCode.width)
  const target = tracked ? findTarget(tracked.value) : null
  if (!tracked || !target) return hide()

  const map = coverMap(
    { width: video.videoWidth, height: video.videoHeight },
    { width: root.clientWidth, height: root.clientHeight }
  )
  // A little more than the code, found from the code's corners (it follows the code's skew and rotation).
  const quad = boxQuad(mapQuad(tracked.corners, map), aroundCode)
  const matrix = quad && homographyMatrix3d(quad, FRAME_SIZE)
  if (!matrix) return hide()

  if (isConfirmed.value !== tracked.confirmed) {
    isConfirmed.value = tracked.confirmed
    if (tracked.confirmed) emit('confirm', target)
    else emit('lose')
  }

  // Holding the code fills the lens ring (`--hold`, 0..1); at the end the code opens by itself. Written from here, like
  // the transform, so Vue does not re-render 60 times a second.
  const hold = !tracked.confirmed ? 0 : isArmed ? Math.min(1, tracked.heldMs / HOLD_MS) : 1
  setHold(hold)
  if (hold >= 1 && isArmed) {
    isArmed = false
    emit('open', target)
  }

  frameNode.style.visibility = 'visible'
  frameNode.style.transform = `matrix3d(${matrix.join(',')})`
}

onMounted(() => {
  frame = requestAnimationFrame(tick)
})

onUnmounted(() => {
  cancelAnimationFrame(frame)
  setHold(0)
})
</script>

<template>
  <div ref="rootEl" class="ScanOverlay">
    <div
      ref="frameEl"
      class="ScanOverlay-frame"
      :class="{ 'ScanOverlay-frame--confirmed': isConfirmed }"
      :style="{ width: `${FRAME_SIZE}px`, height: `${FRAME_SIZE}px` }"
    ></div>
  </div>
</template>

<style lang="scss" scoped>
// The frame is placed from the script every animation frame (a Vue binding would re-render 60 times a second).
.ScanOverlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  &-frame {
    position: absolute;
    top: 0;
    left: 0;
    // width and height come from FRAME_SIZE (template), the matrix maps that box onto the code
    transform-origin: 0 0;
    visibility: hidden;
    box-sizing: border-box;
    border: 2px solid color-mix(in srgb, var(--color-secondary) 55%, transparent);
    box-shadow: 0 0 10px color-mix(in srgb, var(--color-secondary) 40%, transparent);
    opacity: 0.7;
    transition:
      opacity 0.2s,
      border-color 0.2s;
    will-change: transform;

    // Recognised: the same square, brighter. The progress is shown by the lens ring.
    &--confirmed {
      border-color: var(--color-secondary);
      box-shadow:
        0 0 14px var(--color-secondary),
        inset 0 0 14px color-mix(in srgb, var(--color-secondary) 50%, transparent);
      opacity: 1;
      animation: pulse 1.6s ease-in-out infinite;
    }
  }
}

@keyframes pulse {
  50% {
    opacity: 0.65;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ScanOverlay-frame--confirmed {
    animation: none;
  }
}
</style>
