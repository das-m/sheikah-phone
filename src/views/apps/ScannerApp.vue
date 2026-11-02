<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

import BackButton from '@/components/BackButton.vue'
import LensRim from '@/components/LensRim.vue'
import ScanlineOverlay from '@/components/ScanlineOverlay.vue'
import ScanModal from '@/components/ScanModal.vue'
import ScanOverlay from '@/components/ScanOverlay.vue'
import { useCamera } from '@/composables/useCamera'
import { useCodeScanner } from '@/composables/useCodeScanner'
import { useFrameGlow } from '@/composables/useFrameGlow'
import { useScanAction } from '@/composables/useScanAction'
import { scanFilter } from '@/game/scanFilters'
import { findTarget } from '@/game/scanTargets'
import { playSound } from '@/lib/audio'

import soundSystemError from '@/assets/audio/error.ogg'
import soundDetect from '@/assets/audio/camera-detect.ogg'
import soundSensorActivate from '@/assets/audio/sensor-activate.ogg'
import soundSensorError from '@/assets/audio/sensor-error.ogg'
const audioSystemError = new Audio(soundSystemError)
const audioDetect = new Audio(soundDetect)
const audioSensorActivate = new Audio(soundSensorActivate)
const audioSensorError = new Audio(soundSensorError)

/** How long the "unknown code" note stays after a manual entry. */
const NOTE_MS = 2500
/** After the modal is closed, a code confirmed within this time is the one that was just handled. */
const QUIET_AFTER_MODAL_MS = 1500

// Matches the purple tint of the image (`scanFilter`).
useFrameGlow('var(--color-purple)')

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
  // An event that cannot be selected (extinct, out of season): the modal only says why.
  if (content && !before && content.statusText) playSound(audioSensorError)
})

function onSelect() {
  playSound(audioSensorActivate)
  select()
}

function onConfirm() {
  if (performance.now() >= quietUntil) playSound(audioDetect)
}

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
    <div class="App">
      <BackButton />
      <template v-if="!hasFailed">
        <!-- The camera keeps its full-screen box (the overlay's maths depend on it) and is cut to the lens round. -->
        <div class="App-camera">
          <video ref="videoEl" autoplay playsinline muted :style="{ filter: scanFilter }"></video>
          <ScanlineOverlay class="App-scanlines" />
        </div>
        <div ref="lensEl" class="App-lens">
          <LensRim :paused="modal !== null" />
        </div>
        <ScanOverlay
          class="App-overlay"
          :video="videoEl"
          :scan="scan"
          :paused="modal !== null"
          :region="lensEl"
          @confirm="onConfirm"
          @open="run"
        />
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
  --lens-d: min(100vw, calc(100vh - var(--frame-top) - var(--frame-bottom)));
  --lens-top: calc(
    (100% - var(--frame-top) - var(--frame-bottom) - var(--lens-d)) / 2 + var(--frame-top)
  );
  --lens-cy: calc(var(--lens-top) + var(--lens-d) / 2);
  background: radial-gradient(circle at 50% var(--lens-cy), #1c1040, #07040f 80%);
  // The lens does not wait for the loader to be gone (`--screen-delay`): it fades in as the loader's exit (0.65 s)
  // begins and is opaque before the loader lets go, so the blue swirl behind never shows.
  --lens-in: calc(var(--screen-delay) - 0.65s);

  @include camera.stage($scope: false);

  &-camera {
    clip-path: circle(calc(var(--lens-d) / 2) at 50% var(--lens-cy));
    // The lens opens like an iris once the loader is done (the same clip-path trick as the map's reveal).
    animation: lens-open 0.9s var(--lens-in) ease-out both;
  }

  &-lens {
    position: absolute;
    z-index: 30;
    top: var(--lens-top);
    left: 50%;
    width: var(--lens-d);
    height: var(--lens-d);
    transform: translateX(-50%);
    pointer-events: none;
  }

  &-scanlines {
    z-index: 20;
  }

  &-overlay {
    z-index: 35;
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

.lens-leave-active {
  transition: opacity 0.3s ease;
}

.lens-enter-from,
.lens-leave-to {
  opacity: 0;
}

@keyframes lens-open {
  from {
    clip-path: circle(0 at 50% var(--lens-cy));
  }
}

@media (prefers-reduced-motion: reduce) {
  .App-camera {
    animation: none;
  }
}
</style>
