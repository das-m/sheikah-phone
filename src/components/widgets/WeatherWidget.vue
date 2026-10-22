<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
const currentWeatherData = ref(null)
const isReady = ref(false)

onMounted(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(getWeatherData, geolocationError)
  }
})

function getWeatherData(position: any) {
  const apiURL =
    'https://api.brightsky.dev/current_weather?lat=' +
    position.coords.latitude +
    '&lon=' +
    position.coords.longitude
  fetch(apiURL)
    .then((response) => response.json())
    .then((data) => (currentWeatherData.value = data))
}

function geolocationError(error: any) {
  console.error(`ERROR(${error.code}): ${error.message}`)
}

const currentTemperature = computed(() => {
  let output: string = ''
  if (currentWeatherData.value != null) {
    const data: any = currentWeatherData.value
    output = data.weather.temperature + '°C'
  }
  return output
})

const currentIconClass = computed(() => {
  let icon: string | null = null
  if (currentWeatherData.value != null) {
    const data: any = currentWeatherData.value
    icon = data.weather.icon
  }
  return 'WeatherWidget-icon--' + icon
})
</script>

<template>
  <Transition name="fade" appear>
    <div class="WeatherWidget">
      <template v-if="currentWeatherData">
        <div class="WeatherWidget-icon" :class="currentIconClass"></div>
        <div class="WeatherWidget-temperature">{{ currentTemperature }}</div>
      </template>
      <div class="WeatherWidget-loader" v-else></div>
    </div>
  </Transition>
</template>

<style lang="stylus" scoped>
.WeatherWidget
    position relative
    margin 1em auto
    display flex
    align-items center
    justify-content center
    gap 0.75em
    color var(--color-primary)
    text-shadow 0 0 10px var(--color-primary)
    line-height 1

    &-loader
        position absolute
        left calc(50%  - 0.75em)
        top -1em
        width 1.5em
        height 1.5em
        background-image url(@/assets/images/ui/loader.svg)
        background-size contain
        opacity 0.6
        animation spin 3s infinite linear

    &-temperature
        font-size 1.5em

    &-icon
        width 1.5em
        height 1.5em
        background url(@/assets/images/weather/cloudy.svg) center no-repeat
        background-size contain

        &--clear-day
            background-image url(@/assets/images/weather/clear-day.svg)

        &--clear-night
            background-image url(@/assets/images/weather/clear-night.svg)

        &--partly-cloudy-day
            background-image url(@/assets/images/weather/partly-cloudy-day.svg)

        &--partly-cloudy-night
            background-image url(@/assets/images/weather/partly-cloudy-night.svg)

        &--cloudy
            background-image url(@/assets/images/weather/cloudy.svg)

        &--fog
            background-image url(@/assets/images/weather/fog.svg)

        &--wind
            background-image url(@/assets/images/weather/wind.svg)

        &--rain
            background-image url(@/assets/images/weather/rain.svg)

        &--sleet
            background-image url(@/assets/images/weather/sleet.svg)

        &--snow
            background-image url(@/assets/images/weather/snow.svg)

        &--hail
            background-image url(@/assets/images/weather/hail.svg)

        &--thunderstorm
            background-image url(@/assets/images/weather/thunderstorm.svg)
</style>
