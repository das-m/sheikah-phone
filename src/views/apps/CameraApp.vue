<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import BackButton from '@/components/BackButton.vue'
import FairyOverlay from '@/components/FairyOverlay.vue'
import { useCamera } from '@/composables/useCamera'
import { fairyBefriended } from '@/composables/useFairyProgress'
import { useGeolocation } from '@/composables/useGeolocation'
import { fairyZone } from '@/game/fairy'
import { playSound } from '@/lib/audio'
import { isInsideZone } from '@/lib/zone'

import soundSystemError from '@/assets/audio/error.ogg'
const audioSystemError = new Audio(soundSystemError)

const videoEl = ref<HTMLVideoElement | null>(null)
const { hasFailed } = useCamera(videoEl)

watch(hasFailed, (failed) => {
  if (failed) playSound(audioSystemError)
})

// The fairy lives in a small zone. Fallback for bad GPS (and for testing in a browser): open the app with `?fairy`.
const { position, accuracy } = useGeolocation()
const isInFairyZone = ref(false)
watch([position, accuracy], () => {
  if (!position.value) return
  isInFairyZone.value = isInsideZone(
    position.value,
    fairyZone,
    isInFairyZone.value,
    accuracy.value ?? 0
  )
})
const route = useRoute()
// The zone only decides where the first contact happens: once she is there she stays (leaving the zone mid-story does
// not take her away), and a befriended guide is shown everywhere.
const hasSpawned = ref(false)
const mayAppear = computed(() => isInFairyZone.value || route.query.fairy !== undefined)
watch(
  mayAppear,
  (may) => {
    if (may) hasSpawned.value = true
  },
  { immediate: true }
)
const showFairy = computed(() => hasSpawned.value || mayAppear.value || fairyBefriended.value)
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <BackButton />
      <div class="App-camera" v-if="!hasFailed">
        <div class="App-camera-icon"></div>
        <video ref="videoEl" autoplay playsinline muted></video>
        <FairyOverlay v-if="showFairy" />
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
