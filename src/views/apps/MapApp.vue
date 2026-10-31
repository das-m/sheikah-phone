<script setup lang="ts">
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre looks for its worker next to its own module, which does not exist once bundled.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { onMounted, onUnmounted, ref, watch } from 'vue'

import BackButton from '@/components/BackButton.vue'
import ClockWidget from '@/components/widgets/ClockWidget.vue'
import WeatherWidget from '@/components/widgets/WeatherWidget.vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useHeading } from '@/composables/useHeading'
import { pois } from '@/game/pois'
import type { LatLng } from '@/lib/geo'
import { zeldaStyle } from '@/map/zeldaStyle'

maplibregl.setWorkerUrl(workerUrl)

const ludwigsburg: LatLng = { lat: 48.897551, lng: 9.191567 }

const { position: userPosition } = useGeolocation()
const { heading } = useHeading()

const container = ref<HTMLElement | null>(null)

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
  // MapLibre owns the transform of the marker element, so the heading rotates a child (view cone + arrow).
  userArrowEl = document.createElement('div')
  userArrowEl.className = 'App-map-position-heading'
  for (const part of ['cone', 'arrow']) {
    const child = document.createElement('div')
    child.className = `App-map-position-${part}`
    userArrowEl.appendChild(child)
  }
  el.appendChild(userArrowEl)
  return el
}

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
    <!-- Reveal in three beats (timings in the style block): grid backdrop, grid overlay, then the map. -->
    <div class="App-backdrop"></div>
    <div ref="container" class="App-map"></div>
    <div class="App-overlay"></div>

    <div class="App-ui">
      <BackButton />

      <div class="App-map-button App-map-button--recenter" @click="centerMapOnUser"></div>

      <div class="App-map-widgets">
        <ClockWidget />
        <WeatherWidget />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// The loader (App.vue) covers the screen for about 1.2 s and then dissolves over 0.65 s, so the reveal starts
// under it: the grid comes up as the loader fades, the overlay sweeps over it, the map fades in last.
$grid-delay: 1s;
$overlay-delay: 1.6s;
$map-delay: 2.2s;
// Buttons and widgets settle in like the home screen does (fade 1 s, zoom-settle 1.2 s), as the map finishes.
$ui-delay: 2.6s;

.App {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--color-base);

  // 1. the grid backdrop (the end state is the plain style, the animations only start from hidden)
  &-backdrop {
    position: absolute;
    inset: 0;
    background: url(@/assets/images/map/background.jpg) repeat;
    animation: backdrop-in 0.7s $grid-delay ease-out both;
  }

  // 2. a grid overlay sweeps out from the center, stays while the map fades in underneath, then fades away:
  // it belongs to the transition only, the finished map has no grid on it
  &-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: url(@/assets/images/map/map-grid.png) repeat;
    background-size: calc(220 * var(--u));
    opacity: 0;
    animation: overlay-in 1.5s $overlay-delay ease-out both;
  }

  // 4. buttons and widgets, on a full-size layer so the zoom-settle pivots around the screen center
  &-ui {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    animation:
      ui-fade 1s $ui-delay ease both,
      ui-settle 1.2s $ui-delay ease-out both;

    > * {
      pointer-events: auto;
    }
  }

  // 3. the map itself fades in last
  &-map {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    animation: map-in 0.9s $map-delay ease-out both;

    // elements created by MapLibre carry no scope id, hence :deep
    :deep(.App-map-position) {
      width: 50px;
      height: 50px;
    }

    :deep(.App-map-position-heading) {
      position: relative;
      width: 100%;
      height: 100%;
    }

    :deep(.App-map-position-arrow) {
      position: absolute;
      inset: 0;
      background: url(@/assets/images/map/user.svg) center no-repeat;
      background-size: contain;
    }

    // direction.png (110x103) is a view cone whose tip is at (88.5, 97) and whose axis leans 26.5deg to the left
    // of up. It is scaled up, the tip is put on the arrow, and the lean is rotated out so the cone points ahead.
    :deep(.App-map-position-cone) {
      $scale: 1.6;
      $tip-x: 88.5px * $scale;
      $tip-y: 97px * $scale;

      position: absolute;
      width: 110px * $scale;
      height: 103px * $scale;
      left: 25px - $tip-x;
      top: 22px - $tip-y;
      background: url(@/assets/images/map/direction.png) center / 100% 100% no-repeat;
      transform-origin: $tip-x $tip-y;
      transform: rotate(26.5deg);
      pointer-events: none;
    }

    :deep(.App-map-poi) {
      width: 32px;
      height: 32px;
    }

    &-button {
      width: 80px;
      height: 80px;
      position: absolute;
      bottom: calc(var(--frame-bottom) + 8px);
      right: calc(var(--frame-corner-br) + 8px);
      z-index: 100;
      display: block;
      cursor: pointer;

      &:hover {
        &:after {
          background: rgba(0, 0, 0, 0.8);
        }

        &:before {
          border-image: url(@/assets/images/ui/frame-hover.svg) 10 / 20px;
        }
      }

      &:after {
        content: ' ';
        display: block;
        position: absolute;
        z-index: 1;
        top: 10px;
        left: 10px;
        width: calc(100% - 20px);
        aspect-ratio: 1/1;
        background: rgba(0, 0, 0, 0.4);
      }

      &:before {
        content: ' ';
        display: block;
        width: 100%;
        aspect-ratio: 1/1;
        border-image: url(@/assets/images/ui/frame.svg) 10 / 20px;
        background: transparent center no-repeat;
        background-size: 45%;
        pointer-events: none;
        position: relative;
        z-index: 10;
      }

      &--recenter {
        &:before {
          background-image: url(@/assets/images/ui/icons/recenter.svg);
          background-size: 55%;
        }
      }
    }

    // Right-aligned stack under the top-right corner of the frame.
    &-widgets {
      --widget-clock-size: 1.5em;
      --widget-align: flex-end;

      position: absolute;
      z-index: 100;
      top: calc(var(--frame-top) + 12px);
      right: calc(var(--frame-corner-tr) * 0.5);
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }
  }
}

@keyframes backdrop-in {
  from {
    opacity: 0;
  }
}

// The overlay is revealed by a circle growing from the center (75% reaches the corners), is fully there while
// the map fades in underneath (it ends when the map is done), and then fades out.
@keyframes overlay-in {
  from {
    opacity: 0;
    clip-path: circle(0% at 50% 50%);
  }
  30%,
  55% {
    opacity: 1;
  }
  to {
    opacity: 0;
    clip-path: circle(75% at 50% 50%);
  }
}

@keyframes map-in {
  from {
    opacity: 0;
  }
}

@keyframes ui-fade {
  from {
    opacity: 0;
  }
}

@keyframes ui-settle {
  from {
    transform: scale(1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .App-backdrop,
  .App-overlay,
  .App-map,
  .App-ui {
    animation: none;
  }
}
</style>
