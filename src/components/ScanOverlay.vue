<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

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
/** Space kept free at the bottom (above the frame art) for the label and the row of buttons below it, in px. */
const LABEL_ROOM = 110
const LABEL_GAP = 12
/** How long a recognised code must be held in view before it opens by itself (the frame fills up meanwhile). */
const HOLD_MS = 1000

const props = defineProps<{
  video: HTMLVideoElement | null
  scan: ScanState
  /** Scanning rests (the modal is open): the empty readings it publishes then do not mean the code left the view. */
  paused?: boolean
  /** The round view the camera is shown through (the lens): only codes whose center is inside it count. */
  region?: HTMLElement | null
}>()

const emit = defineEmits<{
  /** A code was recognised (once per time it comes into view). */
  confirm: [target: ScanTarget]
  /** A recognised code was held in view for `HOLD_MS`, or its label was tapped. */
  open: [target: ScanTarget]
}>()

const rootEl = ref<HTMLElement | null>(null)
const frameEl = ref<HTMLElement | null>(null)
const labelEl = ref<HTMLElement | null>(null)
const name = ref('')
const isConfirmed = ref(false)

const tracker = createTracker()
let current: ScanTarget | null = null
let seenSeq = -1
let frame = 0
// A code that opened by itself does not open again until it was out of view: scanning rests under the modal, so a
// code still held when it closes would otherwise open it over and over.
let isArmed = true
// The overlay covers the whole screen, the frame art included: the label must stay above the bottom art.
let insetBottom = 0
let observer: ResizeObserver | null = null

function hide() {
  if (frameEl.value) {
    frameEl.value.style.visibility = 'hidden'
    frameEl.value.style.setProperty('--hold', '0')
  }
  if (labelEl.value) labelEl.value.style.visibility = 'hidden'
  current = null
  if (isConfirmed.value) isConfirmed.value = false
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
  const labelNode = labelEl.value
  const video = props.video
  if (!root || !frameNode || !labelNode || !video?.videoWidth) return hide()

  if (props.scan.seq !== seenSeq) {
    seenSeq = props.scan.seq
    // Codes that are not ours (a URL, a foreign QR) get no overlay. TODO(multi): follow every known code.
    // A code outside the lens is not seen by the player, so it must not fill the hold bar or open unseen.
    const lens = lensCircle(root, video)
    const known = props.scan.detections.filter(
      (d) =>
        findTarget(d.value) &&
        (!lens || isInsideCircle(quadCenter(mapQuad(d.corners, lens.map)), lens.circle))
    )
    tracker.update(pickDetection(known, tracker.value), now)
    // A reading without any of our codes: the last one that opened is gone, the next one may open again.
    if (known.length === 0 && !props.paused) isArmed = true
  }
  // The frame is drawn from the code: a big one (a whole card) multiplies the code's jitter, so it is smoothed more.
  const followed = tracker.value === null ? null : findTarget(tracker.value)
  const tracked = tracker.step(now, (followed?.frame ?? aroundCode).width)
  const target = tracked ? findTarget(tracked.value) : null
  if (!tracked || !target) return hide()

  const box = { width: root.clientWidth, height: root.clientHeight }
  const map = coverMap({ width: video.videoWidth, height: video.videoHeight }, box)
  // What the target frames (the code, or the card it sits on), found from the code's corners.
  const quad = boxQuad(mapQuad(tracked.corners, map), target.frame ?? aroundCode)
  const matrix = quad && homographyMatrix3d(quad, FRAME_SIZE)
  if (!quad || !matrix) return hide()

  if (current?.id !== target.id) {
    current = target
    name.value = target.name
  }
  if (isConfirmed.value !== tracked.confirmed) {
    isConfirmed.value = tracked.confirmed
    if (tracked.confirmed) emit('confirm', target)
  }

  // Holding the code fills the frame (`--hold`, 0..1); at the end the code opens by itself. Written from here, like the
  // transform, so Vue does not re-render 60 times a second.
  const hold = !tracked.confirmed ? 0 : isArmed ? Math.min(1, tracked.heldMs / HOLD_MS) : 1
  frameNode.style.setProperty('--hold', hold.toFixed(3))
  if (hold >= 1 && isArmed) {
    isArmed = false
    emit('open', target)
  }

  frameNode.style.visibility = 'visible'
  frameNode.style.transform = `matrix3d(${matrix.join(',')})`

  // The label stays upright and readable below the frame, wherever the code is turned to.
  const center = quadCenter(quad)
  const bottom = Math.max(...quad.map((p) => p.y))
  const x = Math.min(Math.max(center.x, 0), box.width)
  const y = Math.min(bottom + LABEL_GAP, box.height - insetBottom - LABEL_ROOM)
  labelNode.style.visibility = tracked.confirmed ? 'visible' : 'hidden'
  labelNode.style.transform = `translate(${x}px, ${y}px) translateX(-50%)`
}

function onOpen() {
  if (!current || !isConfirmed.value) return
  isArmed = false
  emit('open', current)
}

onMounted(() => {
  const root = rootEl.value
  if (root) {
    // `padding-bottom` is `var(--frame-bottom)`; the computed value is in px.
    observer = new ResizeObserver(() => {
      insetBottom = parseFloat(getComputedStyle(root).paddingBottom) || 0
    })
    observer.observe(root)
  }
  frame = requestAnimationFrame(tick)
})

onUnmounted(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  observer = null
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
    <button ref="labelEl" type="button" class="ScanOverlay-label" @click="onOpen">
      {{ name }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
// Both children are placed from the script every animation frame (a Vue binding would re-render 60 times a second).
.ScanOverlay {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  padding-bottom: var(--frame-bottom);
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
    border: 3px solid color-mix(in srgb, var(--color-primary) 55%, transparent);
    box-shadow: 0 0 10px color-mix(in srgb, var(--color-primary) 40%, transparent);
    opacity: 0.7;
    transition:
      opacity 0.2s,
      border-color 0.2s;
    will-change: transform;

    // Holding the code (`--hold`, 0..1, set from the script): the border thickens and glows, and a bar along the
    // bottom edge of the frame fills up.
    &--confirmed {
      border-color: var(--color-primary);
      border-width: calc(3px + var(--hold, 0) * 3px);
      box-shadow:
        0 0 calc(14px + var(--hold, 0) * 22px) calc(var(--hold, 0) * 3px) var(--color-primary),
        inset 0 0 calc(14px + var(--hold, 0) * 18px)
          color-mix(in srgb, var(--color-primary) 50%, transparent);
      opacity: 1;
      animation: pulse 1.6s ease-in-out infinite;
    }

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 8px;
      background: var(--color-primary);
      box-shadow: 0 0 8px var(--color-primary);
      transform: scaleX(var(--hold, 0));
      transform-origin: 0 50%;
    }
  }

  &-label {
    position: absolute;
    top: 0;
    left: 0;
    visibility: hidden;
    padding: 0.5em 1.2em;
    border-image: url(@/assets/images/ui/frame.svg) 10 / 20px;
    background: rgba(0, 0, 0, 0.6);
    color: var(--color-primary);
    font-size: 1em;
    letter-spacing: 0.1em;
    white-space: nowrap;
    text-shadow: 0 0 8px var(--color-primary);
    pointer-events: auto;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
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
