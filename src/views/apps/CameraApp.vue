<script setup lang="ts">
import { ref, watch } from 'vue'

import BackButton from '@/components/BackButton.vue'
import FairyOverlay from '@/components/FairyOverlay.vue'
import { useCamera } from '@/composables/useCamera'
import { playSound } from '@/lib/audio'

import soundSystemError from '@/assets/audio/error.ogg'
const audioSystemError = new Audio(soundSystemError)

const videoEl = ref<HTMLVideoElement | null>(null)
const { hasFailed } = useCamera(videoEl)

watch(hasFailed, (failed) => {
  if (failed) playSound(audioSystemError)
})
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <BackButton />
      <div class="App-camera" v-if="!hasFailed">
        <div class="App-camera-icon"></div>
        <video ref="videoEl" autoplay playsinline muted></video>
        <FairyOverlay />
      </div>
      <div class="App-camera App-camera--disabled" v-else>
        <div class="App-camera-icon App-camera-icon--disabled"></div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/camera';

.App {
  width: 100%;
  height: 100%;
  position: relative;

  @include camera.stage;

  &-camera video {
    filter: saturate(50%) contrast(150%);
  }
}
</style>
