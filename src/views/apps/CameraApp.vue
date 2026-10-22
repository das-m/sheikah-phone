<script setup lang="ts">
import { ref, onMounted } from 'vue'

import sound_camera_detect from './../../assets/audio/camera-detect.wav'
import sound_system_error from './../../assets/audio/error.wav'
const audio_camera_detect = new Audio(sound_camera_detect)
const audio_system_error = new Audio(sound_system_error)

const constraints = {
  video: {
    width: {
      min: 256,
      ideal: 800,
      max: 1080
    },
    height: {
      min: 256,
      ideal: 1024,
      max: 1920
    },
    facingMode: {
      //Use the back camera
      exact: 'environment'
    }
  }
}

const isSupported = ref(false)

onMounted(() => {
  if (navigator.mediaDevices) {
    initCamera()
  } else {
    handleErrorWithDelay()
  }
})

async function initCamera(): Promise<void> {
  try {
    isSupported.value = true
    const videoStream: any = await navigator.mediaDevices.getUserMedia(constraints)
    const video: any = document.querySelector('#video')
    if (video !== null) {
      if ('srcObject' in video) {
        video.srcObject = videoStream
      } else {
        // Avoid using this in new browsers, as it is going away.
        video.src = URL.createObjectURL(videoStream)
      }
    }
  } catch (error) {
    isSupported.value = false
    handleErrorWithDelay()
  }
}

function handleErrorWithDelay(): void {
  isSupported.value = false
  setTimeout(() => {
    alert('Error! Camera is not supported.')
    audio_system_error.play()
  }, 1500)
}
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <div class="App-camera" v-if="isSupported">
        <div class="App-camera-icon"></div>
        <input type="file" accept="video/*;capture=camcorder" />
        <video autoplay id="video"></video>
      </div>
      <div class="App-camera App-camera--disabled" v-else>
        <div class="App-camera-icon App-camera-icon--disabled"></div>
      </div>
    </div>
  </Transition>
</template>

<style lang="stylus" scoped>
.App
    width 100%
    height 100%
    position relative

    &-camera
        position absolute
        top 0
        width 100%
        height 100%
        z-index 10
        // clip-path circle(55% at 50% 50%)

        &--disabled
            clip-path none

        &-icon
            background transparent url(@/assets/images/overlay/scope.png) center no-repeat
            position fixed
            top 0
            z-index 30
            width 100%
            height 100%
            display block
            opacity 0.7
            pointer-events none

            &--disabled
                position absolute
                top 0
                z-index 0
                width 100%
                height 100%
                background transparent center no-repeat
                background-size 50%
                background-image url(@/assets/images/ui/icons/camera.svg)
                filter grayscale(100%) brightness(-100%)
                opacity 0.3

        video
            position relative
            z-index 10
            width 100%
            height 100%
            object-fit cover
            filter saturate(50%) contrast(150%)
</style>
