<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

import InfoText from './../../components/InfoText.vue'

import sound_sensor_signal from './../../assets/audio/sensor-signal.wav'
const audio_sensor_signal = new Audio(sound_sensor_signal)

let geolocationWatcher: number
const geolocationWatcherOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
}
const testPosition = { lat: 48.7872385, lng: 9.1759729 }

let signalTimer: number
const signalDelay = ref(5000)
const signalPlaying = ref(false)
const userPosition = ref({ lat: 48.897551, lng: 9.191567 })
const userRotation = ref(0)
const isSupported = ref(false)

onMounted(() => {
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientationabsolute', handleDeviceOrientationChange, true)
  }
  if (navigator.geolocation) {
    isSupported.value = true
    updateUserPosition()
    geolocationWatcher = navigator.geolocation.watchPosition(
      updateUserPosition,
      updateUserPositionError,
      geolocationWatcherOptions
    )
  }
  playSignal()
})

onUnmounted(() => {
  clearTimeout(signalTimer)
  if (window.DeviceOrientationEvent) {
    window.removeEventListener('deviceorientationabsolute', handleDeviceOrientationChange)
  }
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(geolocationWatcher)
  }
})

function handleDeviceOrientationChange(event: DeviceOrientationEvent) {
  const alpha: number | null = event.alpha
  const beta: number | null = event.beta
  const gamma: number | null = event.gamma
  if (alpha && beta && gamma) {
    userRotation.value = compassHeading(alpha, beta, gamma)
  }
}

// From http://w3c.github.io/deviceorientation/spec-source-orientation.html#worked-example
function compassHeading(alpha: number, beta: number, gamma: number) {
  // Convert degrees to radians
  var alphaRad = alpha * (Math.PI / 180)
  var betaRad = beta * (Math.PI / 180)
  var gammaRad = gamma * (Math.PI / 180)

  // Calculate equation components
  var cA = Math.cos(alphaRad)
  var sA = Math.sin(alphaRad)
  var cB = Math.cos(betaRad)
  var sB = Math.sin(betaRad)
  var cG = Math.cos(gammaRad)
  var sG = Math.sin(gammaRad)

  // Calculate A, B, C rotation components
  var rA = -cA * sG - sA * sB * cG
  var rB = -sA * sG + cA * sB * cG
  var rC = -cB * cG

  // Calculate compass heading
  var compassHeading = Math.atan(rA / rB)

  // Convert from half unit circle to whole unit circle
  if (rB < 0) {
    compassHeading += Math.PI
  } else if (rA < 0) {
    compassHeading += 2 * Math.PI
  }

  // Convert radians to degrees
  compassHeading *= 180 / Math.PI

  return compassHeading
}

function updateUserPosition() {
  navigator.geolocation.getCurrentPosition(updateUserCoords, updateUserPositionError)
}

function updateUserCoords(position: any) {
  userPosition.value = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  }
}

function updateUserPositionError(error: any) {
  console.error(`ERROR(${error.code}): ${error.message}`)
}

function getDistanceFromLatLonInMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  var deg2Rad = (deg: number) => {
    return (deg * Math.PI) / 180
  }

  var r = 6371000 // Radius of the earth in m
  var dLat = deg2Rad(lat2 - lat1)
  var dLon = deg2Rad(lon2 - lon1)
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2Rad(lat1)) * Math.cos(deg2Rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  var d = r * c // Distance in m
  return d
}

const distance = computed(() => {
  return getDistanceFromLatLonInMeter(
    userPosition.value.lat,
    userPosition.value.lng,
    testPosition.lat,
    testPosition.lng
  )
})

function calcDegreeToTarget(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phiK = (lat2 * Math.PI) / 180.0
  const lambdaK = (lon2 * Math.PI) / 180.0
  const phi = (lat1 * Math.PI) / 180.0
  const lambda = (lon1 * Math.PI) / 180.0
  const psi =
    (180.0 / Math.PI) *
    Math.atan2(
      Math.sin(lambdaK - lambda),
      Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
    )
  return Math.round(psi)
}

const facingRightDirection = computed(() => {
  let answer: Boolean = false
  let degree = calcDegreeToTarget(
    userPosition.value.lat,
    userPosition.value.lng,
    testPosition.lat,
    testPosition.lng
  )
  if (degree < 0) {
    degree = degree + 360
  }

  // ±60 degree
  if (
    (degree < Math.abs(userRotation.value) && degree + 60 > Math.abs(userRotation.value)) ||
    degree > Math.abs(userRotation.value + 60) ||
    degree < Math.abs(userRotation.value)
  ) {
    answer = false
  } else if (degree) {
    answer = true
  }
  return answer
})

const title = 'Entfernung'

const message = computed(() => {
  let message = Math.round(distance.value) + ' Meter'
  if (facingRightDirection.value) {
    message += ', GUT'
  } else {
    message += ', FALSCH'
  }
  return message
})

function playSignal() {
  audio_sensor_signal.volume = 1
  audio_sensor_signal.playbackRate = 1
  audio_sensor_signal.play()

  signalDelay.value = (distance.value / 10) * 5
  signalPlaying.value = true
  setTimeout(() => {
    signalPlaying.value = false
    // init next signal
    signalTimer = setTimeout(() => playSignal(), signalDelay.value)
  }, 1500)
}
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <div class="App-sensor" v-if="isSupported">
        <div class="App-sensor-icon" :class="{ 'is-playing': signalPlaying }"></div>
        <div class="App-sensor-blob" :class="{ 'is-playing': signalPlaying }"></div>

        <InfoText :title="title" :message="message" v-if="message" />
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
        aspect-ratio 1
        width 80%
        max-width 500px

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
