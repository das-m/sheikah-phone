<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import ClockWidget from './../components/widgets/ClockWidget.vue'
import WeatherWidget from './../components/widgets/WeatherWidget.vue'
import { useYigaMode } from '@/composables/useYigaMode'
import { apps } from '@/game/apps'

const version = APP_VERSION

const { mode, enter, reset } = useYigaMode()
const visibleApps = computed(() => apps.filter((app) => app.mode === mode.value))

// Manual fallback for unreliable GPS (and for testing in the browser): tap the version 7 times to toggle Yiga mode.
const DEBUG_TAPS = 7
const DEBUG_TAP_WINDOW_MS = 2000
let versionTaps = 0
let versionTapTimer: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(versionTapTimer))
function onVersionTap() {
  // Taps count only in one burst, so casual taps over a session never add up.
  versionTaps += 1
  clearTimeout(versionTapTimer)
  if (versionTaps < DEBUG_TAPS) {
    versionTapTimer = setTimeout(() => (versionTaps = 0), DEBUG_TAP_WINDOW_MS)
    return
  }
  versionTaps = 0
  if (mode.value === 'yiga') reset()
  else enter()
}
</script>

<template>
  <Transition name="fade" appear>
    <div class="Homescreen">
      <div class="Homescreen-apps">
        <router-link
          v-for="app in visibleApps"
          :key="app.id"
          :class="['Homescreen-apps-item', `Homescreen-apps-item--${app.id}`]"
          :to="app.route"
        ></router-link>
      </div>
      <div class="Homescreen-widgets">
        <WeatherWidget />
        <ClockWidget />
        <div class="Homescreen-widgets-version" @click="onVersionTap">v{{ version }}</div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.Homescreen {
  height: 100%;
  padding: var(--frame-top) 20px var(--frame-bottom);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
  overflow-y: auto;

  // `auto` margins center the block, and unlike `justify-content: center` they never clip it when it overflows
  > :first-child {
    margin-top: auto;
  }

  > :last-child {
    margin-bottom: auto;
  }

  &-apps {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 5px;

    &-item {
      display: block;
      text-align: center;
      color: var(--color-contrast);
      width: clamp(80px, 26vmin, 110px);
      flex-shrink: 0;

      &:before {
        content: ' ';
        display: block;
        width: 100%;
        aspect-ratio: 1/1;
        border-image: url(@/assets/images/ui/frame.svg) 10 / 20px;
        background: transparent center no-repeat;
        background-size: 45%;
      }

      &:hover {
        &:before {
          border-image: url(@/assets/images/ui/frame-hover.svg) 20 / 40px;
        }
      }

      &--map {
        &:before {
          background-image: url(@/assets/images/ui/icons/compass.svg);
          background-size: 55%;
        }
      }

      &--camera {
        &:before {
          background-image: url(@/assets/images/ui/icons/camera.svg);
        }
      }

      &--media {
        &:before {
          background-image: url(@/assets/images/ui/icons/picture.svg);
        }
      }

      &--yiga {
        &:before {
          background-image: url(@/assets/images/ui/icons/scanner.svg);
        }
      }
    }
  }

  &-widgets {
    display: flex;
    flex-direction: column;
    align-items: center;

    &-version {
      font-size: 0.6em;
      margin-top: 1em;
      text-align: center;
      color: var(--color-primary);
    }
  }
}

.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-active {
  transition:
    opacity 1s 1s ease,
    transform 1.2s 1s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(1.2);
}
</style>
