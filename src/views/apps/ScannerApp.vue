<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

import BackButton from '@/components/BackButton.vue'
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
const audioSystemError = new Audio(soundSystemError)
const audioDetect = new Audio(soundDetect)

/** How long the "unknown code" note stays after a manual entry. */
const NOTE_MS = 2500

// Matches the purple tint of the image (`scanFilter`).
useFrameGlow('var(--color-purple)')

const videoEl = ref<HTMLVideoElement | null>(null)
// QR codes read fine at 720p, and a smaller frame is cheaper to scan.
const { isReady, hasFailed } = useCamera(videoEl, {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1280 },
  height: { ideal: 720 }
})

const { modal, run, close } = useScanAction()
// Scanning rests while the modal is open and takes up again when it is closed.
const isScanning = computed(() => isReady.value && modal.value === null)
const scan = useCodeScanner(videoEl, isScanning)

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
  <Transition name="fade" appear>
    <div class="App">
      <BackButton />
      <div class="App-camera" v-if="!hasFailed">
        <div class="App-camera-icon"></div>
        <video ref="videoEl" autoplay playsinline muted :style="{ filter: scanFilter.css }"></video>
        <ScanlineOverlay class="App-scanlines" v-if="scanFilter.scanlines" />
        <ScanOverlay
          class="App-overlay"
          :video="videoEl"
          :scan="scan"
          @confirm="playSound(audioDetect)"
          @open="run"
        />
      </div>
      <div class="App-camera App-camera--disabled" v-else>
        <div class="App-camera-icon App-camera-icon--disabled"></div>
      </div>

      <form class="App-entry" v-if="isEntering" @submit.prevent="submitCode">
        <input
          v-model="typedCode"
          class="App-entry-input"
          type="text"
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

      <ScanModal :content="modal" @close="close" />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.App {
  width: 100%;
  height: 100%;
  position: relative;

  &-camera {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 10;

    &-icon {
      background: transparent url(@/assets/images/overlay/scope.png) center no-repeat;
      position: fixed;
      top: 0;
      z-index: 30;
      width: 100%;
      height: 100%;
      display: block;
      opacity: 0.7;
      pointer-events: none;

      &--disabled {
        position: absolute;
        top: 0;
        z-index: 0;
        width: 100%;
        height: 100%;
        background: transparent center no-repeat;
        background-size: 50%;
        background-image: url(@/assets/images/ui/icons/camera.svg);
        filter: grayscale(100%) brightness(-100%);
        opacity: 0.3;
      }
    }

    video {
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &-scanlines {
    z-index: 20;
  }

  &-overlay {
    z-index: 35;
  }

  &-controls {
    position: absolute;
    z-index: 40;
    left: 50%;
    bottom: calc(var(--frame-bottom) + 0.5rem);
    transform: translateX(-50%);
    display: flex;
    gap: 1rem;
  }

  &-entry {
    position: absolute;
    z-index: 40;
    left: 50%;
    bottom: calc(var(--frame-bottom) + 4.5rem);
    transform: translateX(-50%);
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
    left: 0;
    right: 0;
    bottom: calc(var(--frame-bottom) + 8rem);
    margin: 0;
    text-align: center;
    color: var(--color-red);
    text-shadow: 0 0 0.5rem var(--color-base);
  }

  &-button {
    padding: 0.5em 1.2em;
    border-image: url(@/assets/images/ui/frame.svg) 10 / 20px;
    background: rgba(0, 0, 0, 0.6);
    color: var(--color-primary);
    font-size: 0.9em;
    letter-spacing: 0.1em;
    text-shadow: 0 0 8px var(--color-primary);
    cursor: pointer;

    &:hover {
      border-image: url(@/assets/images/ui/frame-hover.svg) 10 / 20px;
      background: rgba(0, 0, 0, 0.8);
    }
  }
}
</style>
