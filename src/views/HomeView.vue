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
      <ClockWidget class="Homescreen-clock" />
      <div class="Homescreen-apps">
        <router-link
          v-for="app in visibleApps"
          :key="app.id"
          :class="['Homescreen-apps-item', `Homescreen-apps-item--${app.id}`]"
          :to="app.route"
        ></router-link>
      </div>
      <WeatherWidget class="Homescreen-weather" />
      <div class="Homescreen-version" @click="onVersionTap">v{{ version }}</div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
// Portrait: clock on top, apps in the middle, weather at the bottom.
// Landscape: clock and weather in the upper corners, apps below them (see the media query).
// The grid row of the apps takes the free space, and unlike centering it never clips when content overflows.
.Homescreen {
  height: 100%;
  padding: calc(var(--frame-top) + 1.5rem) 20px calc(var(--frame-bottom) + 1rem);
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto auto;
  grid-template-areas: 'clock' 'apps' 'weather' 'version';
  justify-items: center;
  overflow-y: auto;

  &-clock {
    grid-area: clock;
  }

  &-weather {
    grid-area: weather;
  }

  &-version {
    grid-area: version;
    font-size: 0.6em;
    margin-top: 1em;
    text-align: center;
    color: var(--color-primary);
  }

  &-apps {
    grid-area: apps;
    align-self: center;
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

      &--scanner {
        &:before {
          background-image: url(@/assets/images/ui/icons/scanner.svg);
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

  @media (orientation: landscape) {
    padding-inline: 0;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto 1fr auto;
    grid-template-areas: 'clock weather' 'apps apps' 'version version';

    // Distances from the screen edge, in art units. Not equal on purpose: an optical adjustment, so the
    // two widgets look evenly spaced beside the different corner art. Only the widgets are inset, the apps
    // and the version stay centered on the screen.
    &-clock {
      --widget-clock-size: 1.8em;
      --widget-align: flex-start;
      justify-self: start;
      margin-left: calc(195 * var(--u));
    }

    &-weather {
      --widget-align: flex-end;
      justify-self: end;
      margin-right: calc(220 * var(--u));
    }
  }
}

.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-active {
  transition:
    opacity 1s var(--screen-delay) ease,
    transform 1.2s var(--screen-delay) ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(1.2);
}
</style>
