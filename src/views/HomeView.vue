<script setup lang="ts">
import { computed, ref } from 'vue'
import ClockWidget from './../components/widgets/ClockWidget.vue'
import WeatherWidget from './../components/widgets/WeatherWidget.vue'
import { useYigaMode } from '@/composables/useYigaMode'
import { apps } from '@/game/apps'

const version = APP_VERSION

const { mode, forceInZone } = useYigaMode()
const visibleApps = computed(() => apps.filter((app) => app.mode === mode.value))

// Manual fallback for unreliable GPS: tap the version 7 times to pretend to be inside the Yiga zone.
const DEBUG_TAPS = 7
const versionTaps = ref(0)
function onVersionTap() {
  versionTaps.value += 1
  if (versionTaps.value < DEBUG_TAPS) return
  versionTaps.value = 0
  forceInZone.value = !forceInZone.value
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

<style lang="stylus" scoped>
.Homescreen
    height 100%
    padding 50px 20px
    display flex
    align-items center
    justify-content center

    &-apps
        display flex
        align-items center
        justify-content center
        flex-wrap wrap
        gap 5px
        margin-bottom 50px

        &-item
            display block
            text-align center
            color var(--color-contrast)
            width 110px
            flex-shrink 0

            &:before
                content " "
                display block
                width 100%
                aspect-ratio 1/1
                border-image url(@/assets/images/ui/frame.svg) 10 / 20px
                background transparent center no-repeat
                background-size 45%

            &:hover
                &:before
                    border-image url(@/assets/images/ui/frame-hover.svg) 20 / 40px

            &--map
                &:before
                    background-image url(@/assets/images/ui/icons/compass.svg)
                    background-size 55%

            &--sensor
                &:before
                    background-image url(@/assets/images/ui/icons/sensor.svg)

            &--camera
                &:before
                    background-image url(@/assets/images/ui/icons/camera.svg)

            &--media
                &:before
                  background-image url(@/assets/images/ui/icons/picture.svg)

            &--reader
                &:before
                    background-image url(@/assets/images/ui/icons/reader.svg)

            &--yiga
                &:before
                    background-image url(@/assets/images/ui/icons/scanner.svg)

    &-widgets
        position absolute
        bottom 100px

        &-version
            font-size 0.6em
            margin-top 1em
            text-align center
            color var(--color-primary)

.fade-leave-active
    transition opacity 1s ease

.fade-enter-active
    transition opacity 1s 1s ease, transform 1.2s 1s ease-out

.fade-enter-from
.fade-leave-to
    opacity 0
    transform scale(1.2)
</style>
