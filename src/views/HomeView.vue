<script setup lang="ts">
import ClockWidget from './../components/widgets/ClockWidget.vue'
import WeatherWidget from './../components/widgets/WeatherWidget.vue'
const version = APP_VERSION
</script>

<template>
  <Transition name="fade" appear>
    <div class="Homescreen">
      <div class="Homescreen-apps">
        <router-link class="Homescreen-apps-item Homescreen-apps-item--map" to="/map"></router-link>
        <router-link
          class="Homescreen-apps-item Homescreen-apps-item--sensor"
          to="/sensor"
        ></router-link>
        <router-link
          class="Homescreen-apps-item Homescreen-apps-item--camera"
          to="/camera"
        ></router-link>
        <router-link
          class="Homescreen-apps-item Homescreen-apps-item--media"
          to="/media"
        ></router-link>
        <router-link
          class="Homescreen-apps-item Homescreen-apps-item--reader"
          to="/reader"
        ></router-link>
      </div>
      <div class="Homescreen-widgets">
        <WeatherWidget />
        <ClockWidget />
        <div class="Homescreen-widgets-version">v{{ version }}</div>
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
