<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import InfoText from './../../components/InfoText.vue'

import sound_sensor_signal from './../../assets/audio/sensor-signal.wav'
const audio_sensor_signal = new Audio(sound_sensor_signal)

let compassInterval: number
let pointDegree: number

const testTarget: position = {
  coords: {
    lat: 48.7872385,
    lng: 9.1759729
  }
}

// From https://dev.to/orkhanjafarovr/real-compass-on-mobile-browsers-with-javascript-3emi
const isIOS: boolean = !(
  navigator.userAgent.match(/(iPod|iPhone|iPad)/) && navigator.userAgent.match(/AppleWebKit/)
)

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>
  webkitCompassHeading?: number | null
}

interface position {
  coords: coords
}
interface coords {
  lat: number
  lng: number
}

const userPosition = ref({ lat: 48.897551, lng: 9.191567 })
const compassHeading = ref(0)
const signalStrength = ref(0)

onMounted(() => {
  startCompass()
  updateUserPosition()
  compassInterval = setInterval(() => tick(), 5000)
})

onUnmounted(() => {
  clearInterval(compassInterval)
  if (window.DeviceOrientationEvent) {
    window.removeEventListener('deviceorientationabsolute', updateCompassOrientation)
  }
})

async function startCompass() {
  if (isIOS) {
    const requestPermission = (DeviceOrientationEvent as unknown as DeviceOrientationEventiOS)
      .requestPermission
    const iOS = typeof requestPermission === 'function'
    if (iOS) {
      const response = await requestPermission()
      if (response === 'granted') {
        window.addEventListener('deviceorientation', updateCompassOrientation, true)
      } else {
        alert('has to be allowed!')
      }
    } else {
      window.addEventListener('deviceorientationabsolute', updateCompassOrientation, true)
    }
  }
}

function updateCompassOrientation(event: DeviceOrientationEventiOS) {
  if (typeof event.alpha === 'number') {
    compassHeading.value = event.webkitCompassHeading || Math.abs(event.alpha - 360)
  }
  // ±15 degree
  if (
    (pointDegree < Math.abs(compassHeading.value) &&
      pointDegree + 25 > Math.abs(compassHeading.value)) ||
    pointDegree > Math.abs(compassHeading.value + 25) ||
    pointDegree < Math.abs(compassHeading.value)
  ) {
    //signalStrength.value = (pointDegree - Math.abs(compassHeading.value)) / 1000
    signalStrength.value = 0.5
  } else if (pointDegree) {
    signalStrength.value = 1
  }
}

function updateUserPosition() {
  navigator.geolocation.getCurrentPosition(updateUserCoords, updateUserPositionError)
}

function updateUserCoords(position: position | any) {
  userPosition.value = position.coords

  // TODO: refactor to computed!

  pointDegree = calcDegreeToTarget(position.coords, testTarget.coords)
  if (pointDegree < 0) {
    pointDegree = pointDegree + 360
  }
}

function updateUserPositionError(error: any) {
  console.error(`ERROR(${error.code}): ${error.message}`)
}

function calcDegreeToTarget(from: coords, target: coords): number {
  const phiK = (target.lat * Math.PI) / 180.0
  const lambdaK = (target.lng * Math.PI) / 180.0
  const phi = (from.lat * Math.PI) / 180.0
  const lambda = (from.lng * Math.PI) / 180.0
  const psi =
    (180.0 / Math.PI) *
    Math.atan2(
      Math.sin(lambdaK - lambda),
      Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
    )
  return Math.round(psi)
}

function calcDistanceInMeter(from: coords, target: coords): number {
  var deg2Rad = (deg: number) => {
    return (deg * Math.PI) / 180
  }

  var r = 6371000 // Radius of the earth in m
  var dLat = deg2Rad(target.lat - from.lat)
  var dLon = deg2Rad(target.lng - from.lng)
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2Rad(from.lat)) *
      Math.cos(deg2Rad(target.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  var d = r * c // Distance in m
  return d
}

function tick() {
  playSignal()
}

function playSignal() {
  audio_sensor_signal.volume = signalStrength.value
  audio_sensor_signal.play()
}

const distance = computed(() => {
  return calcDistanceInMeter(userPosition.value, testTarget.coords)
})

const title = 'Entfernung'

const message = computed(() => {
  if (distance.value) {
    let message = Math.round(distance.value) + ' Meter'
    return message
  } else {
    return false
  }
})
</script>

<template>
  <div class="CompassWidget">
    <div class="CompassWidget-compass">
      <div class="CompassWidget-compass-arrow"></div>
      <div
        class="CompassWidget-compass-circle"
        :style="{
          transform: 'translate(-50%, -50%) rotate(' + compassHeading + 'deg)'
        }"
      ></div>
      <div class="CompassWidget-compass-target"></div>
    </div>
    <InfoText :title="title" :message="message" v-if="message" />
  </div>
</template>

<style lang="stylus" scoped>
.CompassWidget
    position relative

    &-compass
        position relative
        width 300px
        height 300px
        border-radius 50%
        box-shadow 0 0 15px rgba(0, 0, 0, 0.2)
        margin auto

        &-arrow
            position absolute
            width 0
            height 0
            top -20px
            left 50%
            transform translateX(-50%)
            background var(--color-primary)
            border-radius 50%
            z-index 1

        &-target
            opacity 0
            width 30px
            height 30px
            background red
            border-radius 50%
            transition opacity 0.5s ease-out

        &-circle
        &-target
            position absolute
            width 80%
            height 80%
            top 50%
            left 50%
            transform translate(-50%, -50%)
            transition transform 0.1s ease-out
            background url(@/assets/images/ui/compass.png) center no-repeat
            background-size contain
</style>
