<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

import { useCamera } from '@/composables/useCamera'
import { useQrScanner } from '@/composables/useQrScanner'
import { useUnlocks } from '@/composables/useUnlocks'
import { findTarget, type LensTarget } from '@/game/lens'
import { playSound } from '@/lib/audio'

import soundSystemError from '@/assets/audio/error.ogg'
import soundDetect from '@/assets/audio/camera-detect.ogg'
const audioSystemError = new Audio(soundSystemError)
const audioDetect = new Audio(soundDetect)

/** How long the name of a scanned target stays on screen. */
const LABEL_MS = 4000

const videoEl = ref<HTMLVideoElement | null>(null)
const { isReady, hasFailed } = useCamera(videoEl)

const isLensOn = ref(false)
const scanned = ref<LensTarget | null>(null)
const { unlock } = useUnlocks()
let labelTimer: ReturnType<typeof setTimeout> | null = null

const isScanning = computed(() => isLensOn.value && isReady.value)
const { inView } = useQrScanner(videoEl, isScanning, (raw) => {
  const target = findTarget(raw)
  if (!target) return
  unlock(`${target.kind}:${target.id}`)
  scanned.value = target
  playSound(audioDetect)
  if (labelTimer !== null) clearTimeout(labelTimer)
  labelTimer = setTimeout(() => (scanned.value = null), LABEL_MS)
})

watch(hasFailed, (failed) => {
  if (failed) playSound(audioSystemError)
})

onUnmounted(() => {
  if (labelTimer !== null) clearTimeout(labelTimer)
})
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <div class="App-camera" v-if="!hasFailed">
        <div class="App-camera-icon"></div>
        <video ref="videoEl" autoplay playsinline muted></video>
        <button
          type="button"
          class="App-lens"
          :class="{ 'App-lens--on': isLensOn }"
          :aria-pressed="isLensOn"
          aria-label="Sheikah-Linse"
          @click="isLensOn = !isLensOn"
        ></button>
        <div class="App-lensFrame" :class="{ 'App-lensFrame--seen': inView }" v-if="isLensOn"></div>
        <p class="App-lensName" v-if="scanned">{{ scanned.name }}</p>
      </div>
      <div class="App-camera App-camera--disabled" v-else>
        <div class="App-camera-icon App-camera-icon--disabled"></div>
      </div>
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
    // clip-path circle(55% at 50% 50%)

    &--disabled {
      clip-path: none;
    }

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
      filter: saturate(50%) contrast(150%);
    }
  }

  &-lens {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    z-index: 40;
    width: 3.5rem;
    height: 3.5rem;
    border: 2px solid var(--color-primary);
    border-radius: 50%;
    background: rgba(1, 7, 16, 0.6) url(@/assets/images/ui/icons/scanner.svg) center / 60% no-repeat;
    opacity: 0.7;

    &--on {
      opacity: 1;
      box-shadow: 0 0 1rem var(--color-primary);
    }
  }

  &-lensFrame {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 35;
    width: 65vmin;
    height: 65vmin;
    transform: translate(-50%, -50%);
    border: 2px dashed var(--color-primary);
    pointer-events: none;

    &--seen {
      border-style: solid;
      border-color: var(--color-secondary);
    }
  }

  &-lensName {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 6rem;
    z-index: 40;
    margin: 0;
    text-align: center;
    font-size: 1.5rem;
    color: var(--color-primary);
    text-shadow: 0 0 0.5rem var(--color-base);
  }
}
</style>
