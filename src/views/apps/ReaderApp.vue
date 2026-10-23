<script setup lang="ts">
import { computed, watch } from 'vue'

import InfoText from '@/components/InfoText.vue'
import { useNfc } from '@/composables/useNfc'
import { playSound } from '@/lib/audio'

import soundSensorActivate from '@/assets/audio/sensor-activate.ogg'
import soundSensorError from '@/assets/audio/sensor-error.ogg'
import soundSensorTouch from '@/assets/audio/sensor-touch.ogg'
import soundSystemError from '@/assets/audio/error.ogg'
const audioActivate = new Audio(soundSensorActivate)
const audioError = new Audio(soundSensorError)
const audioTouch = new Audio(soundSensorTouch)
const audioSystemError = new Audio(soundSystemError)

const { status, readings, readCount, hasReadError, start } = useNfc()

async function activate() {
  await start()
  if (status.value === 'scanning') playSound(audioActivate)
  else if (status.value !== 'idle') playSound(audioSystemError)
}

watch(readCount, () => playSound(audioTouch))
watch(hasReadError, (failed) => failed && playSound(audioError))

const isSupported = computed(() => status.value !== 'unsupported')
const isScanning = computed(() => status.value === 'scanning')

const title = 'Leser'

const message = computed(() => {
  if (status.value === 'denied') return 'Zugriff auf NFC wurde verweigert'
  if (status.value === 'error') return 'NFC konnte nicht gestartet werden, erneut berühren'
  if (status.value === 'idle') return 'Berühren zum Aktivieren'
  if (hasReadError.value) return 'Zeichen nicht lesbar'
  if (readCount.value === 0) return 'Halte das Gerät an ein Zeichen'
  return readings.value.map((reading) => reading.text).join('\n') || 'Leeres Zeichen'
})
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <div class="App-sensor" v-if="isSupported" @click="activate">
        <div class="App-sensor-icon" :class="{ 'is-scanning': isScanning }"></div>
        <div class="App-sensor-blob" :class="{ 'is-scanning': isScanning }"></div>
        <div
          class="App-sensor-blob App-sensor-blob--second"
          :class="{ 'is-scanning': isScanning }"
        ></div>

        <InfoText class="App-sensor-info" :title="title" :message="message" />
      </div>
      <div class="App-sensor" v-else>
        <div class="App-sensor-icon App-sensor-icon--disabled"></div>
        <InfoText
          class="App-sensor-info"
          :title="title"
          message="NFC wird von diesem Gerät nicht unterstützt"
        />
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.App {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &-sensor {
    position: relative;
    cursor: pointer;
    aspect-ratio: 1/1;
    width: 80%;
    max-width: 500px;

    &-info {
      position: absolute;
      top: 72%;
      left: 0;
      right: 0;
      margin: 0 auto;
      pointer-events: none;
    }

    &-icon {
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
      background: transparent center no-repeat;
      background-size: 40%;
      background-image: url(@/assets/images/ui/icons/reader.svg);
      animation: none;
      filter: brightness(60%);

      &.is-scanning {
        animation: icon-pulse 1s ease infinite;
      }

      &--disabled {
        background-image: url(@/assets/images/ui/icons/reader.svg);
        background-size: 50%;
        animation: none;
        filter: grayscale(100%) brightness(-100%);
        opacity: 0.3;
      }
    }

    &-blob {
      position: absolute;
      border: solid 8px #9decfd;
      border-radius: 50%;
      width: 100%;
      height: 100%;
      transform: scale(1);
      opacity: 0;
      animation: none;

      &.is-scanning {
        animation: pulse 2s linear infinite;
      }

      &--second {
        animation-delay: 1s;
      }
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.4);
    opacity: 0;
  }
  30% {
    transform: scale(0.8);
    opacity: 0.3;
  }
  80% {
    transform: scale(2.1);
    opacity: 0;
  }
  100% {
    transform: scale(2.1);
    opacity: 0;
  }
}

@keyframes icon-pulse {
  0% {
    filter: brightness(100%);
  }
  30% {
    filter: brightness(80%);
  }
  80% {
    filter: brightness(80%);
  }
  100% {
    filter: brightness(100%);
  }
}
</style>
