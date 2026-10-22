<script setup lang="ts">
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre looks for its worker next to its own module, which does not exist once bundled.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { onMounted, onUnmounted, ref, watch } from 'vue'

import ClockWidget from '@/components/widgets/ClockWidget.vue'
import WeatherWidget from '@/components/widgets/WeatherWidget.vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useHeading } from '@/composables/useHeading'
import { pois } from '@/game/pois'
import type { LatLng } from '@/lib/geo'
import { zeldaStyle } from '@/map/zeldaStyle'

maplibregl.setWorkerUrl(workerUrl)

const ludwigsburg: LatLng = { lat: 48.897551, lng: 9.191567 }
const INTRO_DELAY_MS = 2500

const { position: userPosition } = useGeolocation()
const { heading } = useHeading()

const container = ref<HTMLElement | null>(null)
const isActive = ref(false)

let map: maplibregl.Map | null = null
let userMarker: maplibregl.Marker | null = null
let userArrowEl: HTMLElement | null = null

const toLngLat = (p: LatLng): [number, number] => [p.lng, p.lat]

function createPoiMarker(poi: { title: string; icon: string }): HTMLElement {
  const el = document.createElement('img')
  el.src = poi.icon
  el.alt = poi.title
  el.title = poi.title
  el.className = 'App-map-poi'
  return el
}

function createUserMarker(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'App-map-position'
  el.style.zIndex = '10'
  // MapLibre owns the transform of the marker element, so the heading rotates a child.
  userArrowEl = document.createElement('div')
  userArrowEl.className = 'App-map-position-arrow'
  el.appendChild(userArrowEl)
  return el
}

const introTimer = setTimeout(() => (isActive.value = true), INTRO_DELAY_MS)

onMounted(() => {
  if (!container.value) return
  map = new maplibregl.Map({
    container: container.value,
    style: zeldaStyle,
    center: toLngLat(userPosition.value ?? ludwigsburg),
    zoom: 16,
    attributionControl: { compact: true }
  })

  for (const poi of pois) {
    new maplibregl.Marker({ element: createPoiMarker(poi) })
      .setLngLat(toLngLat(poi.position))
      .addTo(map)
  }

  // A GPS fix may have arrived before the map existed.
  if (userPosition.value) updateUserMarker(userPosition.value)
})

onUnmounted(() => {
  clearTimeout(introTimer)
  map?.remove()
  map = null
})

function updateUserMarker(position: LatLng) {
  if (!map) return
  if (!userMarker) {
    userMarker = new maplibregl.Marker({ element: createUserMarker() })
      .setLngLat(toLngLat(position))
      .addTo(map)
  } else {
    userMarker.setLngLat(toLngLat(position))
  }
}

watch(userPosition, (position) => position && updateUserMarker(position), { immediate: true })

// Follow the user once, on the first GPS fix. After that the recenter button is in control.
const stopWatchingFirstFix = watch(userPosition, (position) => {
  if (!position) return
  map?.easeTo({ center: toLngLat(position) })
  stopWatchingFirstFix()
})

watch(heading, (value) => {
  if (userArrowEl) userArrowEl.style.transform = `rotate(${value ?? 0}deg)`
})

function centerMapOnUser() {
  if (userPosition.value) map?.easeTo({ center: toLngLat(userPosition.value), zoom: 17 })
}
</script>

<template>
  <div class="App">
    <div ref="container" class="App-map"></div>

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

        // elements created by MapLibre carry no scope id, hence :deep
        :deep(&-position)
            width 50px
            height 50px

        :deep(&-position-arrow)
            width 100%
            height 100%
            background url(@/assets/images/map/user.svg) center no-repeat
            background-size contain

        :deep(&-poi)
            width 32px
            height 32px

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
