<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
interface CurrentWeather {
  weather: { temperature: number; icon: string }
}

const currentWeatherData = ref<CurrentWeather | null>(null)

onMounted(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(getWeatherData, geolocationError)
  }
})

function getWeatherData(position: GeolocationPosition) {
  const apiURL =
    'https://api.brightsky.dev/current_weather?lat=' +
    position.coords.latitude +
    '&lon=' +
    position.coords.longitude
  fetch(apiURL)
    .then((response) => {
      if (!response.ok) throw new Error(`Bright Sky responded with ${response.status}`)
      return response.json() as Promise<CurrentWeather>
    })
    .then((data) => (currentWeatherData.value = data))
    .catch((error) => console.error(error))
}

function geolocationError(error: GeolocationPositionError) {
  console.error(`ERROR(${error.code}): ${error.message}`)
}

const currentTemperature = computed(() =>
  currentWeatherData.value ? currentWeatherData.value.weather.temperature + '°C' : ''
)

const currentIconClass = computed(
  () => 'WeatherWidget-icon--' + (currentWeatherData.value?.weather.icon ?? null)
)
</script>

<template>
  <Transition name="fade" appear>
    <div class="WeatherWidget">
      <div class="WeatherWidget-current">
        <template v-if="currentWeatherData">
          <div class="WeatherWidget-icon" :class="currentIconClass"></div>
          <div class="WeatherWidget-temperature">{{ currentTemperature }}</div>
        </template>
        <div class="WeatherWidget-loader" v-else></div>
      </div>
      <div class="WeatherWidget-label" aria-hidden="true">Wetter</div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/widget';

// The parent sets the alignment of the content through `--widget-align` (flex alignment).
.WeatherWidget {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: var(--widget-align, center);
  color: var(--color-primary);
  text-shadow: 0 0 10px var(--color-primary);
  line-height: 1;

  &-current {
    display: flex;
    align-items: center;
    gap: 0.75em;
    padding: 0.2em 0;
  }

  &-label {
    @include widget.label;
  }

  &-loader {
    width: 1.5em;
    height: 1.5em;
    background-image: url(@/assets/images/ui/loader.svg);
    background-size: contain;
    opacity: 0.6;
    animation: spin 3s infinite linear;
  }

  &-temperature {
    font-size: 1.5em;
  }

  &-icon {
    width: 1.5em;
    height: 1.5em;
    background: url(@/assets/images/weather/cloudy.svg) center no-repeat;
    background-size: contain;

    &--clear-day {
      background-image: url(@/assets/images/weather/clear-day.svg);
    }

    &--clear-night {
      background-image: url(@/assets/images/weather/clear-night.svg);
    }

    &--partly-cloudy-day {
      background-image: url(@/assets/images/weather/partly-cloudy-day.svg);
    }

    &--partly-cloudy-night {
      background-image: url(@/assets/images/weather/partly-cloudy-night.svg);
    }

    &--cloudy {
      background-image: url(@/assets/images/weather/cloudy.svg);
    }

    &--fog {
      background-image: url(@/assets/images/weather/fog.svg);
    }

    &--wind {
      background-image: url(@/assets/images/weather/wind.svg);
    }

    &--rain {
      background-image: url(@/assets/images/weather/rain.svg);
    }

    &--sleet {
      background-image: url(@/assets/images/weather/sleet.svg);
    }

    &--snow {
      background-image: url(@/assets/images/weather/snow.svg);
    }

    &--hail {
      background-image: url(@/assets/images/weather/hail.svg);
    }

    &--thunderstorm {
      background-image: url(@/assets/images/weather/thunderstorm.svg);
    }
  }
}
</style>
