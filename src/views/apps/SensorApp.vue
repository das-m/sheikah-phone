<script setup lang="ts">
import { computed } from 'vue'

import InfoText from '@/components/InfoText.vue'
import { useBeeper } from '@/composables/useBeeper'
import { useGeolocation } from '@/composables/useGeolocation'
import { useHeading } from '@/composables/useHeading'
import { beepRange, facingToleranceDeg, offCourseVolume, sensorTarget } from '@/game/sensor'
import { bearingDegrees, beepIntervalMs, distanceMeters, isFacing } from '@/lib/geo'
import { playSound } from '@/lib/audio'

import soundSensorSignal from '@/assets/audio/sensor-signal.ogg'
import soundSensorActivate from '@/assets/audio/sensor-activate.ogg'
const audioSensorActivate = new Audio(soundSensorActivate)

const { position, error, isSupported } = useGeolocation()
const { heading } = useHeading()

const distance = computed(() =>
  position.value ? distanceMeters(position.value, sensorTarget.position) : null
)

const facingTarget = computed(() => {
  if (!position.value || heading.value === null) return false
  return isFacing(
    heading.value,
    bearingDegrees(position.value, sensorTarget.position),
    facingToleranceDeg
  )
})

const { isRunning, isPulsing, start, stop } = useBeeper(soundSensorSignal, () => {
  const interval = beepIntervalMs(distance.value ?? beepRange.farMeters, beepRange)
  return facingTarget.value
    ? { intervalMs: interval * 0.7, volume: 1 }
    : { intervalMs: interval, volume: offCourseVolume }
})

function toggleSensor() {
  if (isRunning.value) {
    stop()
  } else {
    playSound(audioSensorActivate)
    start()
  }
}

const title = 'Entfernung'

const message = computed(() => {
  if (!isRunning.value) return 'Berühren zum Aktivieren'
  if (error.value) return 'Kein Standort verfügbar'
  if (distance.value === null) return 'Suche Signal …'
  return Math.round(distance.value) + ' Meter, ' + (facingTarget.value ? 'GUT' : 'FALSCH')
})
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <div class="App-sensor" v-if="isSupported" @click="toggleSensor">
        <div class="App-sensor-icon" :class="{ 'is-playing': isPulsing }"></div>
        <div class="App-sensor-blob" :class="{ 'is-playing': isPulsing }"></div>

        <InfoText class="App-sensor-info" :title="title" :message="message" />
      </div>
      <div class="App-sensor App-sensor--disabled" v-else>
        <div class="App-sensor-icon App-sensor-icon--disabled"></div>
      </div>
    </div>
  </Transition>
</template>

<style lang="stylus" scoped>
.App
    width 100%
    height 100%
    position relative
    display flex
    flex-direction column
    align-items center
    justify-content center

    &-sensor
        position relative
        cursor pointer
        aspect-ratio 1
        width 80%
        max-width 500px

        &-info
            position absolute
            top 72%
            left 0
            right 0
            margin 0 auto
            pointer-events none

        &-icon
            position absolute
            top 0
            width 100%
            height 100%
            background transparent center no-repeat
            background-size 40%
            background-image url(@/assets/images/ui/icons/sensor.svg)

            animation none
            filter brightness(60%)

            &.is-playing
              animation icon-pulse 1s ease

            &--disabled
                background-image url(@/assets/images/ui/icons/sensor.svg)
                background-size 50%
                animation none
                filter grayscale(100%) brightness(-100%)
                opacity 0.3

        &-blob
            position absolute
            border solid 8px #9decfd
            border-radius 50%
            width 100%
            height 100%
            transform scale(1)
            opacity 0

            &.is-playing
              animation pulse 1s linear

    @keyframes pulse
      0%
        transform scale(0.4)
        opacity 0
      30%
        transform scale(0.8)
        opacity 0.3
      80%
        transform scale(2.1)
        opacity 0
      100%
        transform scale(2.1)
        opacity 0

    @keyframes icon-pulse
      0%
        filter brightness(60%)
      25%
        filter brightness(80%)
      50%
        filter brightness(60%)
      75%
        filter brightness(80%)
      100%
        filter brightness(60%)
</style>
