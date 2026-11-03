<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

import BackButton from '@/components/BackButton.vue'
import LensRim from '@/components/LensRim.vue'
import ScanlineOverlay from '@/components/ScanlineOverlay.vue'
import ScanModal from '@/components/ScanModal.vue'
import ScanOverlay from '@/components/ScanOverlay.vue'
import { useCamera } from '@/composables/useCamera'
import { useCodeScanner } from '@/composables/useCodeScanner'
import { useScanAction } from '@/composables/useScanAction'
import { useScreenAngle } from '@/composables/useScreenAngle'
import { LENS_SCALE, LENS_SHIFT, scanFilter } from '@/game/scanFilters'
import { findTarget, type ScanTarget } from '@/game/scanTargets'
import { playSound } from '@/lib/audio'
import { lensOffset } from '@/lib/lens'

import soundSystemError from '@/assets/audio/error.ogg'
import soundDetect from '@/assets/audio/lens-detect.ogg'
import soundConfirm from '@/assets/audio/confirm.wav'
import soundModalOpen from '@/assets/audio/sensor-touch.ogg'
import soundSensorError from '@/assets/audio/sensor-error.ogg'
const audioSystemError = new Audio(soundSystemError)
const audioDetect = new Audio(soundDetect)
const audioConfirm = new Audio(soundConfirm)
const audioModalOpen = new Audio(soundModalOpen)
const audioSensorError = new Audio(soundSensorError)

/** How long the "unknown code" note stays after a manual entry. */
const NOTE_MS = 2500
/** After the modal is closed, a code confirmed within this time is the one that was just handled. */
const QUIET_AFTER_MODAL_MS = 1500

const videoEl = ref<HTMLVideoElement | null>(null)
// The round lens box: the rim is drawn in it, and codes outside it do not count (ScanOverlay `region`).
const lensEl = ref<HTMLElement | null>(null)
// The codes on the cards are small, so a module needs as many pixels as it can get: 1080p. If the frame rate of the
// scanner drops on a phone, go back to 1280x720 (a smaller frame is cheaper to scan).
const { isReady, hasFailed } = useCamera(videoEl, {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1920 },
  height: { ideal: 1080 }
})

const { modal, run, close, select } = useScanAction()
// Scanning rests while the modal is open and takes up again when it is closed.
const isScanning = computed(() => isReady.value && modal.value === null)
const scan = useCodeScanner(videoEl, isScanning)

// Scanning pauses under the modal, so a code still held in view is found again when it closes: no second chime then.
let quietUntil = 0
watch(modal, (content, before) => {
  if (before && !content) quietUntil = performance.now() + QUIET_AFTER_MODAL_MS
  if (!content || before) return
  // An event that cannot be selected (extinct, out of season): the modal only says why.
  playSound(content.statusText ? audioSensorError : audioModalOpen)
})

function onSelect() {
  playSound(audioConfirm)
  select()
}

// The recognised code: its name shows beside the lens and the lens ring takes the detection color while it is held.
const detected = ref<ScanTarget | null>(null)

function onConfirm(target: ScanTarget) {
  detected.value = target
  if (performance.now() >= quietUntil) playSound(audioDetect)
}

// The physical camera is not in the middle of the phone: the image moves toward its end (`lib/lens.ts`).
const screenAngle = useScreenAngle()
const lensShift = computed(() => lensOffset(screenAngle.value, LENS_SHIFT))

// Manual fallback for a damaged code or a camera that does not work.
const isEntering = ref(false)
const typedCode = ref('')
const note = ref('')
let noteTimer: ReturnType<typeof setTimeout> | null = null

function showNote(text: string) {
  note.value = text
  if (noteTimer !== null) clearTimeout(noteTimer)
  noteTimer = setTimeout(() => (note.value = ''), NOTE_MS)
}

function submitCode() {
  const target = findTarget(typedCode.value)
  if (!target) {
    playSound(audioSystemError)
    showNote('Unbekannter Code')
    return
  }
  typedCode.value = ''
  isEntering.value = false
  run(target)
}

watch(hasFailed, (failed) => {
  if (failed) playSound(audioSystemError)
})

onUnmounted(() => {
  if (noteTimer !== null) clearTimeout(noteTimer)
})
</script>

<template>
  <Transition name="lens" appear>
    <div class="App" :style="{ '--lens-shift': lensShift, '--lens-scale': LENS_SCALE }">
      <BackButton />
      <template v-if="!hasFailed">
        <!-- The camera keeps its full-screen box (the overlay's maths depend on it) and is cut to the lens round. -->
        <div class="App-camera">
          <video ref="videoEl" autoplay playsinline muted :style="{ filter: scanFilter }"></video>
          <ScanlineOverlay class="App-scanlines" />
        </div>
        <div ref="lensEl" class="App-lens">
          <LensRim :paused="modal !== null" :detected="detected !== null" />
        </div>
        <ScanOverlay
          class="App-overlay"
          :video="videoEl"
          :scan="scan"
          :paused="modal !== null"
          :region="lensEl"
          @confirm="onConfirm"
          @lose="detected = null"
          @open="run"
        />
        <!-- Beside the lens; a tap opens it at once (the fallback for the hold). -->
        <Transition name="detected">
          <button v-if="detected" type="button" class="App-detected" @click="run(detected)">
            <span class="App-detected-id">{{ detected.id }}</span> {{ detected.name }}
          </button>
        </Transition>
      </template>
      <div class="App-camera App-camera--disabled" v-else>
        <div class="App-camera-icon App-camera-icon--disabled"></div>
      </div>

      <form class="App-entry" v-if="isEntering" @submit.prevent="submitCode">
        <input
          v-model="typedCode"
          class="App-entry-input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="Code"
          placeholder="Code"
        />
        <button type="submit" class="App-button">Los</button>
      </form>
      <p class="App-note" v-if="note">{{ note }}</p>

      <div class="App-controls">
        <button type="button" class="App-button" @click="isEntering = !isEntering">
          Code eingeben
        </button>
      </div>

      <ScanModal :content="modal" @close="close" @select="onSelect" />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/button';
@use '@/assets/scss/camera';

.App {
  width: 100%;
  height: 100%;
  position: relative;
  // The lens: a circle as big as the free height (or the width, in a narrow window), centered between the frame art.
  // The camera is cut to the same circle, so both are derived from these three values.
  // The lens is bigger than the free height (`LENS_SCALE`, `--lens-scale` from the script): it reaches under the stone strips
  // of the frame, which cover its top and bottom. `--lens-base` is the plain free height, the measure of the image shift.
  --lens-free: calc(100vh - var(--frame-top) - var(--frame-bottom));
  --lens-base: min(100vw, var(--lens-free));
  --lens-d: min(100vw, calc(var(--lens-free) * var(--lens-scale, 1)));
  --lens-top: calc(
    (100% - var(--frame-top) - var(--frame-bottom) - var(--lens-d)) / 2 + var(--frame-top)
  );
  --lens-cy: calc(var(--lens-top) + var(--lens-d) / 2);
  --lens-cx: 50%;
  // The lens stays in the middle of the screen; the image moves under it instead (`--lens-shift`, set from the script, a
  // signed fraction of the diameter, see `lib/lens.ts`), so what is held in front of the phone's middle shows in the lens.
  // The overlay moves with the video, so its maths (video pixels to screen) stay as they are.
  --cam-dx: calc(var(--lens-base) * var(--lens-shift, 0) * -1);
  background: radial-gradient(circle at var(--lens-cx) var(--lens-cy), #1c1040, #07040f 80%);
  // The lens does not wait for the loader to be gone (`--screen-delay`): it fades in as the loader's exit (0.65 s)
  // begins and is opaque before the loader lets go, so the blue swirl behind never shows.
  --lens-in: calc(var(--screen-delay) - 0.65s);

  @include camera.stage($scope: false);

  &-camera {
    clip-path: circle(calc(var(--lens-d) / 2) at var(--lens-cx) var(--lens-cy));
    // The lens opens like an iris once the loader is done (the same clip-path trick as the map's reveal).
    animation: lens-open 0.9s var(--lens-in) ease-out both;

    video {
      translate: var(--cam-dx) 0;
    }
  }

  &-lens {
    position: absolute;
    z-index: 30;
    top: var(--lens-top);
    left: calc(var(--lens-cx) - var(--lens-d) / 2);
    width: var(--lens-d);
    height: var(--lens-d);
    pointer-events: none;
  }

  // The name of the recognised code, right of the lens (landscape: free space beside the circle).
  &-detected {
    position: absolute;
    z-index: 40;
    top: var(--lens-cy);
    right: calc(var(--frame-corner-br) + 0.5rem);
    transform: translateY(-50%);
    max-width: max(8rem, calc((100vw - var(--lens-d)) / 2 - 1.5rem));
    padding: 0.4em 0.2em;
    border: 0;
    border-bottom: 2px solid var(--color-secondary);
    background: rgba(0, 0, 0, 0.55);
    color: var(--color-secondary);
    font-family: Roboto, sans-serif;
    font-style: italic;
    font-size: 1.1em;
    text-align: right;
    text-shadow: 0 0 8px var(--color-secondary);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &-id {
      opacity: 0.7;
    }
  }

  &-scanlines {
    z-index: 20;
  }

  &-overlay {
    z-index: 35;
    translate: var(--cam-dx) 0;
  }

  // Beside the lens, in the lower right corner, so they never cover it.
  &-controls {
    position: absolute;
    z-index: 40;
    right: calc(var(--frame-corner-br) + 0.5rem);
    bottom: calc(var(--frame-bottom) + 0.5rem);
    display: flex;
    gap: 1rem;
  }

  &-entry {
    position: absolute;
    z-index: 40;
    right: calc(var(--frame-corner-br) + 0.5rem);
    bottom: calc(var(--frame-bottom) + 4.5rem);
    display: flex;
    gap: 0.8rem;

    &-input {
      width: 12rem;
      padding: 0.4em 0.2em;
      border: 0;
      border-bottom: 2px solid var(--color-primary);
      background: rgba(0, 0, 0, 0.6);
      color: var(--color-contrast);
      font-size: 1em;
      text-align: center;

      &:focus {
        outline: none;
        border-bottom-color: var(--color-primary-hover);
      }
    }
  }

  &-note {
    position: absolute;
    z-index: 40;
    right: calc(var(--frame-corner-br) + 0.5rem);
    bottom: calc(var(--frame-bottom) + 8rem);
    margin: 0;
    text-align: right;
    color: var(--color-red);
    text-shadow: 0 0 0.5rem var(--color-base);
  }

  &-button {
    padding: 0.5em 1.2em;
    font-size: 0.9em;
    @include button.framed(0.6);
  }
}

.lens-enter-active {
  transition: opacity 0.4s var(--lens-in) ease;
}

// Longer than the loader's backdrop fade-in (0.3 s), so the purple loader is opaque before the lens is gone and the
// blue home screen never shows through; the mirror of the intro's `--lens-in`.
.lens-leave-active {
  transition: opacity 0.45s ease-in-out;
}

.lens-enter-from,
.lens-leave-to {
  opacity: 0;
}

@keyframes lens-open {
  from {
    clip-path: circle(0 at var(--lens-cx) var(--lens-cy));
  }
}

.detected-enter-active,
.detected-leave-active {
  transition: opacity 0.2s;
}

.detected-enter-from,
.detected-leave-to {
  opacity: 0;
}
</style>
