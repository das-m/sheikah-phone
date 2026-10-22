<script setup lang="ts">
import { GoogleMap, Marker, CustomMarker } from 'vue3-google-map'
import { computed, onUnmounted, ref, watch } from 'vue'

import ClockWidget from '@/components/widgets/ClockWidget.vue'
import WeatherWidget from '@/components/widgets/WeatherWidget.vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useHeading } from '@/composables/useHeading'
import { pois } from '@/game/pois'
import type { LatLng } from '@/lib/geo'
import { zeldaMapStyles } from '@/map/zeldaStyles'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

const ludwigsburg: LatLng = { lat: 48.897551, lng: 9.191567 }
const INTRO_DELAY_MS = 2500

const { position: userPosition } = useGeolocation()
const { heading } = useHeading()

const mapCenter = ref<LatLng>(ludwigsburg)
const isActive = ref(false)

const introTimer = setTimeout(() => (isActive.value = true), INTRO_DELAY_MS)
onUnmounted(() => clearTimeout(introTimer))

// Follow the user once, on the first GPS fix. After that the recenter button is in control.
const stopWatchingFirstFix = watch(userPosition, (position) => {
  if (!position) return
  mapCenter.value = { ...position }
  stopWatchingFirstFix()
})

function centerMapOnUser() {
  // A fresh object is required: the map only moves when the `center` prop changes identity.
  if (userPosition.value) mapCenter.value = { ...userPosition.value }
}

const userLocationMarker = computed(() => ({
  anchorPoint: 'CENTER' as const,
  position: userPosition.value ?? ludwigsburg,
  zIndex: 999
}))
</script>

<template>
  <div class="App">
    <GoogleMap
      class="App-map"
      :api-key="apiKey"
      :center="mapCenter"
      :zoom="17"
      :disable-default-ui="true"
      :styles="zeldaMapStyles"
      v-if="isActive && apiKey"
    >
      <CustomMarker :options="userLocationMarker" v-if="userPosition">
        <div
          class="App-map-position"
          :style="{ transform: 'rotate(' + (heading ?? 0) + 'deg)' }"
        ></div>
      </CustomMarker>

      <Marker v-for="poi in pois" :key="poi.title" :options="poi" />
    </GoogleMap>

    <p class="App-map-error" v-if="isActive && !apiKey">
      Kein Google-Maps-Schlüssel gesetzt (VITE_GOOGLE_MAPS_API_KEY in .env.local).
    </p>

    <Transition name="fade" delay="1000" appear>
      <div v-if="isActive">
        <div class="App-map-button App-map-button--recenter" @click="centerMapOnUser"></div>

        <div class="App-map-widgets">
          <WeatherWidget />
          <ClockWidget />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="stylus" scoped>
.App
    width 100%
    height 100%
    position relative
    background url(@/assets/images/map/background.jpg) repeat

    &-map
        width 100%
        height 100%

        &-error
            position absolute
            top 50%
            width 100%
            padding 0 2em
            text-align center
            color var(--color-red)

        &-position
            background url(@/assets/images/map/user.svg) center no-repeat
            background-size contain
            width 50px
            height 50px

        &-button
            width 80px
            height 80px
            position absolute
            bottom 60px
            right 20px
            z-index 100
            display block
            cursor pointer

            &:hover

                &:after
                    background rgba(0, 0, 0, 0.8)

                &:before
                    border-image url(@/assets/images/ui/frame-hover.svg) 10 / 20px

            &:after
                content " "
                display block
                position absolute
                z-index 1
                top 10px
                left 10px
                width calc(100% - 20px)
                aspect-ratio 1/1
                background rgba(0, 0, 0, 0.4)


            &:before
                content " "
                display block
                width 100%
                aspect-ratio 1/1
                border-image url(@/assets/images/ui/frame.svg) 10 / 20px
                background transparent center no-repeat
                background-size 45%
                pointer-events none
                position relative
                z-index 10

            &--recenter
                &:before
                    background-image url(@/assets/images/ui/icons/recenter.svg)
                    background-size 55%


        /*
          the following implementation is buggy...
          TODO: style widgets internal, controlled by mode attr? or by context?
        */
        &-widgets
            position absolute
            top 100px
            right 20px
            gap 0

            .WeatherWidget
                justify-content flex-end

            .ClockWidget
                font-size 1.5em
</style>
