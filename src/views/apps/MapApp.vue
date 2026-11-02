<script setup lang="ts">
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre looks for its worker next to its own module, which does not exist once bundled.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { onMounted, onUnmounted, ref, watch } from 'vue'

import soundSensorActivate from '@/assets/audio/sensor-activate.ogg'
import soundSensorDeactivate from '@/assets/audio/sensor-error.ogg'
import markerIconArea from '@/assets/images/map/area.png'
import BackButton from '@/components/BackButton.vue'
import ClockWidget from '@/components/widgets/ClockWidget.vue'
import WeatherWidget from '@/components/widgets/WeatherWidget.vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useHeading } from '@/composables/useHeading'
import { useSensorBeeper } from '@/composables/useSensorBeeper'
import { useSensorMode } from '@/composables/useSensorMode'
import { areaLabelMaxZoom, areas, poiLevels, pois, regions } from '@/game/markers'
import type { Area, Poi, Region, Visibility } from '@/game/markers'
import { playSound } from '@/lib/audio'
import { metersPerPixel } from '@/lib/geo'
import type { LatLng } from '@/lib/geo'
import { zoomOpacity } from '@/lib/zoomVisibility'
import { zeldaStyle } from '@/map/zeldaStyle'

maplibregl.setWorkerUrl(workerUrl)

const ludwigsburg: LatLng = { lat: 48.897551, lng: 9.191567 }

// The intro starts REVEAL_AFTER_MS after the screen delay (grid, then the user marker) and waits for the map to be
// painted, but not longer than REVEAL_WAIT_MAX_MS (tiles may never come when offline).
const REVEAL_AFTER_MS = 1300
const REVEAL_WAIT_MAX_MS = 4000
// An area outline wider than this is not drawn.
const MAX_AREA_OUTLINE_PX = 4000

const { position: userPosition } = useGeolocation()
const { heading } = useHeading()

// Sensor mode: the scanner selects a sensor, it beeps while the map is open, the HUD switches it off and on.
const { selected: selectedSensor, active: activeSensor, toggle: toggleSensor } = useSensorMode()
useSensorBeeper()
const audioSensorActivate = new Audio(soundSensorActivate)
const audioSensorDeactivate = new Audio(soundSensorDeactivate)

function onSensorTap() {
  playSound(activeSensor.value ? audioSensorDeactivate : audioSensorActivate)
  toggleSensor()
}

const root = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)
const revealed = ref(false)

let map: maplibregl.Map | null = null
let userMarker: maplibregl.Marker | null = null
let userArrowEl: HTMLElement | null = null
let revealTimers: number[] = []

// `content` is the element that scales and fades with the zoom (MapLibre owns the transform of the marker element).
interface ZoomMarker {
  content: HTMLElement
  range: Visibility
  onZoom?: (zoom: number) => void
  /** The opacity last written, -1 before the first update. */
  opacity: number
}
const zoomMarkers: ZoomMarker[] = []

const toLngLat = (p: LatLng): [number, number] => [p.lng, p.lat]

function addMarker(
  position: LatLng,
  range: Visibility,
  content: HTMLElement,
  onZoom?: (zoom: number) => void
) {
  if (!map) return
  const element = document.createElement('div')
  element.className = 'App-map-marker'
  element.appendChild(content)
  new maplibregl.Marker({ element }).setLngLat(toLngLat(position)).addTo(map)
  zoomMarkers.push({ content, range, onZoom, opacity: -1 })
}

function createPoi(poi: Poi) {
  const el = document.createElement('img')
  el.src = poi.icon
  el.alt = poi.title
  el.title = poi.title
  el.className = 'App-map-poi'
  const level = poiLevels[poi.level ?? 1]
  el.style.setProperty('--scale', String(level.scale))
  addMarker(poi.position, { minZoom: level.minZoom, ...poi }, el)
}

// The dotted outline has the real radius, so it grows with the zoom; the label (ring icon with the optional icon
// inside of it, and the title) stays the same size and fades out when zoomed in far.
function createArea(area: Area) {
  const el = document.createElement('div')
  el.className = 'App-map-area'
  const label = document.createElement('div')
  label.className = 'App-map-area-label'
  el.appendChild(label)
  const ring = document.createElement('img')
  ring.src = markerIconArea
  ring.alt = ''
  ring.className = 'App-map-area-ring'
  label.appendChild(ring)
  if (area.icon) {
    const icon = document.createElement('img')
    icon.src = area.icon
    icon.alt = ''
    icon.className = 'App-map-area-icon'
    label.appendChild(icon)
  }
  const title = document.createElement('span')
  title.className = 'App-map-area-title'
  title.textContent = area.title
  label.appendChild(title)
  addMarker(area.position, area, el, (zoom) => {
    const labelOpacity = zoomOpacity(zoom, { maxZoom: area.labelMaxZoom ?? areaLabelMaxZoom })
    label.style.opacity = String(labelOpacity)
    label.style.visibility = labelOpacity === 0 ? 'hidden' : 'visible'
    const size = (2 * area.radiusMeters) / metersPerPixel(area.position.lat, zoom)
    // Once the outline is wider than several screens it is not drawn (a huge layer is costly on a phone).
    const huge = size > MAX_AREA_OUTLINE_PX
    el.classList.toggle('App-map-area--huge', huge)
    el.style.setProperty('--size', huge ? '0px' : `${size}px`)
  })
}

function createRegion(region: Region) {
  const el = document.createElement('div')
  el.className = 'App-map-region'
  el.style.setProperty('--scale', String(region.scale ?? 1))
  const name = document.createElement('span')
  name.className = 'App-map-region-name'
  name.textContent = region.name
  el.appendChild(name)
  if (region.caption) {
    const caption = document.createElement('span')
    caption.className = 'App-map-region-caption'
    caption.textContent = region.caption
    el.appendChild(caption)
  }
  addMarker(region.position, region, el)
}

function updateZoomMarkers() {
  if (!map) return
  const zoom = map.getZoom()
  for (const marker of zoomMarkers) {
    const opacity = zoomOpacity(zoom, marker.range)
    // Nothing to do for a marker that stays invisible (the zoom event fires every frame).
    if (opacity === 0 && marker.opacity === 0) continue
    if (opacity !== marker.opacity) {
      marker.opacity = opacity
      marker.content.style.opacity = String(opacity)
      marker.content.style.visibility = opacity === 0 ? 'hidden' : 'visible'
    }
    marker.onZoom?.(zoom)
  }
}

function createUserMarker(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'App-map-position'
  el.style.zIndex = '10'
  // Created after the intro (late GPS fix): appear at once.
  if (revealed.value) el.classList.add('App-map-position--late')
  const ping = document.createElement('div')
  ping.className = 'App-map-position-ping'
  el.appendChild(ping)
  // MapLibre owns the transform of the marker element, so the heading rotates a child (view cone + arrow).
  userArrowEl = document.createElement('div')
  userArrowEl.className = 'App-map-position-heading'
  for (const part of ['cone', 'arrow']) {
    const child = document.createElement('div')
    child.className = `App-map-position-${part}`
    userArrowEl.appendChild(child)
  }
  el.appendChild(userArrowEl)
  // The heading may have arrived before the first GPS fix, which is when this marker is created.
  applyHeading(heading.value)
  return el
}

function applyHeading(value: number | null) {
  if (userArrowEl) userArrowEl.style.transform = `rotate(${value ?? 0}deg)`
}

// Third beat of the intro: the map is revealed by a circle growing from the user (or the map center).
function reveal() {
  if (revealed.value || !map || !root.value) return
  revealTimers.forEach((timer) => window.clearTimeout(timer))
  revealTimers = []
  const origin = map.project(toLngLat(userPosition.value ?? ludwigsburg))
  root.value.style.setProperty('--reveal-x', `${origin.x}px`)
  root.value.style.setProperty('--reveal-y', `${origin.y}px`)
  revealed.value = true
}

function scheduleReveal(m: maplibregl.Map) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // `--screen-delay` is set per transition (boot, route change, mode switch) and inherited from App.vue.
  const screenDelay = root.value
    ? parseFloat(getComputedStyle(root.value).getPropertyValue('--screen-delay')) || 0
    : 0
  const earliest = reducedMotion ? 0 : screenDelay * 1000 + REVEAL_AFTER_MS

  let timerDone = false
  let mapDone = false
  const go = () => {
    if (timerDone && mapDone) reveal()
  }
  revealTimers.push(
    window.setTimeout(() => {
      timerDone = true
      go()
    }, earliest),
    window.setTimeout(() => {
      mapDone = true
      go()
    }, earliest + REVEAL_WAIT_MAX_MS)
  )
  m.once('idle', () => {
    mapDone = true
    go()
  })
}

onMounted(() => {
  if (!container.value) return
  map = new maplibregl.Map({
    container: container.value,
    style: zeldaStyle,
    center: toLngLat(userPosition.value ?? ludwigsburg),
    zoom: 16,
    minZoom: 11,
    attributionControl: { compact: true }
  })

  // Order is the stacking order: areas below the POIs below the region names (which do not take pointer events).
  areas.forEach(createArea)
  pois.forEach(createPoi)
  regions.forEach(createRegion)
  updateZoomMarkers()
  map.on('zoom', updateZoomMarkers)

  // A GPS fix may have arrived before the map existed.
  if (userPosition.value) updateUserMarker(userPosition.value)

  scheduleReveal(map)
})

onUnmounted(() => {
  revealTimers.forEach((timer) => window.clearTimeout(timer))
  revealTimers = []
  zoomMarkers.length = 0
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

watch(heading, applyHeading)

function centerMapOnUser() {
  if (userPosition.value) map?.easeTo({ center: toLngLat(userPosition.value), zoom: 17 })
}
</script>

<template>
  <div ref="root" class="App" :class="{ 'App--revealed': revealed }">
    <!-- Intro in four beats (timings in the style block): grid, user marker, map reveal, markers and buttons. -->
    <div class="App-grid"></div>
    <div ref="container" class="App-map"></div>

    <div class="App-ui">
      <BackButton />

      <div class="App-map-button App-map-button--recenter" @click="centerMapOnUser"></div>

      <!-- The sensor: a button like the recenter one with the signal icon (an X when switched off) and, left of it, the
        name of the target (or "Aus"). Not there before a sensor was activated once (it would be a spoiler), then it
        stays: "Aus" when switched off, until another sensor is activated. Dimmed when the target has no location
        (nothing to measure, so it is silent). Tap: switch on/off. -->
      <div
        v-if="selectedSensor"
        class="App-map-sensor"
        :class="{ 'App-map-sensor--silent': activeSensor && !activeSensor.location }"
      >
        <span class="App-map-sensor-text" aria-hidden="true">
          <span class="App-map-sensor-name">{{ activeSensor ? activeSensor.name : 'Aus' }}</span>
          <span class="App-map-sensor-label">Sensor</span>
        </span>
        <button
          type="button"
          class="App-map-button App-map-button--sensor"
          :class="{ 'App-map-button--sensor-on': activeSensor }"
          :aria-label="
            activeSensor
              ? `Sensor ${activeSensor.name} ausschalten`
              : `Sensor ${selectedSensor.name} einschalten`
          "
          @click="onSensorTap"
        ></button>
      </div>

      <div class="App-map-widgets">
        <ClockWidget />
        <WeatherWidget />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/surface';
@use '@/assets/scss/widget';

// The intro starts once the loader is gone (--screen-delay). Beats 1 and 2 are plain delays, the reveal (3) is
// started from the script once the map is painted (class App--revealed); beat 4 follows inside of it.
$grid-delay: var(--screen-delay);
$user-delay: calc(var(--screen-delay) + 0.6s);
$reveal-duration: 1.2s;
// Markers, buttons and widgets settle in like the home screen does, as the circle is about halfway.
$settle-delay: 0.6s;

// Pale khaki lettering in a thin weight with a darker olive glow, like the labels of the game map: no edge, no neon.
// The runes use the same look.
@mixin map-label($runes: false) {
  @if $runes {
    @include widget.label;
  } @else {
    font-family: 'Roboto', sans-serif;
    font-weight: 400;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  color: var(--color-map-label);
  text-shadow:
    0 0 3px color-mix(in srgb, var(--color-map-label-glow) 80%, transparent),
    0 0 8px color-mix(in srgb, var(--color-map-label-glow) 70%, transparent),
    0 0 14px color-mix(in srgb, var(--color-map-label-glow) 45%, transparent);
}

.App {
  @include surface.surface;

  --reveal-x: 50%;
  --reveal-y: 50%;

  width: 100%;
  height: 100%;
  position: relative;

  // 1. one grid on the swirl, centered so its tiles are symmetric. It is only there for the intro: the finished map
  // covers it.
  &-grid {
    position: absolute;
    inset: 0;
    background: url(@/assets/images/map/map-grid.png) center / calc(220 * var(--u)) repeat;
    animation: grid-in 0.7s $grid-delay ease-out both;
  }

  // 4. buttons and widgets, on a full-size layer so the zoom-settle pivots around the screen center
  &-ui {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    visibility: hidden;

    > * {
      pointer-events: auto;
    }
  }

  &--revealed &-ui {
    visibility: visible;
    animation:
      ui-fade 1s $settle-delay ease both,
      ui-settle 1.2s $settle-delay ease-out both;
  }

  // 3. only the canvas is clipped, the user marker lives beside it and is already there (2)
  &-map {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;

    :deep(.maplibregl-canvas) {
      clip-path: circle(0 at var(--reveal-x) var(--reveal-y));
    }

    :deep(.maplibregl-control-container) {
      opacity: 0;
    }

    // 4. POIs, areas and regions
    :deep(.App-map-marker) {
      opacity: 0;
    }

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
      animation: user-in 0.5s $user-delay ease-out both;
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
      animation: fade-in 0.6s calc(var(--screen-delay) + 0.9s) ease-out both;
    }

    // a sonar ping around the user, twice, as the marker appears
    :deep(.App-map-position-ping) {
      position: absolute;
      inset: 0;
      border: 2px solid var(--color-primary);
      border-radius: 50%;
      pointer-events: none;
      // invisible outside of its keyframes (a backwards fill would show the ring during the delay)
      opacity: 0;
      animation: user-ping 1.4s $user-delay ease-out 2 forwards;
    }

    // a late GPS fix: no intro to wait for
    :deep(.App-map-position--late) {
      .App-map-position-arrow,
      .App-map-position-cone,
      .App-map-position-ping {
        animation-delay: 0s;
      }
    }

    // --scale comes from the POI level (markers.ts)
    :deep(.App-map-poi) {
      width: calc(32px * var(--scale, 1));
      height: calc(32px * var(--scale, 1));
    }

    // Area: dotted outline with the real radius (--size is set from the zoom), ring icon and title in the middle.
    :deep(.App-map-area) {
      --size: 0px;

      position: relative;
      width: var(--size);
      height: var(--size);
      border: max(2px, calc(4 * var(--u))) dotted var(--color-secondary);
      border-radius: 50%;
      background: color-mix(in srgb, var(--color-secondary) 8%, transparent);
      box-shadow:
        0 0 12px color-mix(in srgb, var(--color-secondary) 50%, transparent),
        inset 0 0 12px color-mix(in srgb, var(--color-secondary) 30%, transparent);
      box-sizing: border-box;
      pointer-events: none;
    }

    // area.png is 84x84
    :deep(.App-map-area--huge) {
      border: none;
      background: none;
      box-shadow: none;
    }

    // ring icon, icon and title, faded together when zoomed in far
    :deep(.App-map-area-label) {
      position: absolute;
      inset: 0;
    }

    :deep(.App-map-area-ring),
    :deep(.App-map-area-icon) {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    :deep(.App-map-area-ring) {
      width: calc(84 * var(--u));
      height: calc(84 * var(--u));
    }

    :deep(.App-map-area-icon) {
      width: calc(42 * var(--u));
      height: calc(42 * var(--u));
    }

    :deep(.App-map-area-title) {
      @include map-label;

      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, 0);
      margin-top: calc(48 * var(--u));
      font-size: 1.1em;
    }

    // Region: a big name and a runic caption under it, sized by --scale (markers.ts).
    :deep(.App-map-region) {
      font-size: calc(1em * var(--scale, 1));
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25em;
      text-align: center;
      white-space: nowrap;
      pointer-events: none;
    }

    :deep(.App-map-region-name) {
      @include map-label;

      font-size: 2em;
    }

    :deep(.App-map-region-caption) {
      @include map-label($runes: true);

      font-size: 1.5em;
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

      // the sensor button sits in the sensor row, not at the corner, and is a <button>: no default look
      &--sensor {
        position: relative;
        bottom: auto;
        right: auto;
        flex: none;
        padding: 0;
        border: 0;
        background: none;
        -webkit-tap-highlight-color: transparent;

        &:before {
          // both icons have the same size (41 x 44.6), so one background-size
          background-image: url(@/assets/images/map/sensor-off.svg);
          background-size: 50%;
        }
      }

      &--sensor-on:before {
        background-image: url(@/assets/images/map/sensor-on.svg);
      }
    }

    // The sensor row, left of the recenter button: the name in the size of the clock digits with the runic caption under
    // it (right-aligned, like the widgets), then the sensor button.
    &-sensor {
      position: absolute;
      z-index: 100;
      bottom: calc(var(--frame-bottom) + 8px);
      right: calc(var(--frame-corner-br) + 8px + 80px + 8px);
      height: 80px;
      display: flex;
      align-items: center;
      gap: 0.6em;
      color: var(--color-primary);
      text-shadow: 0 0 10px var(--color-primary);

      &--silent {
        opacity: 0.5;
      }

      &-text {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      &-name {
        max-width: 12em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 1.55em;
        font-weight: 400;
        line-height: 1.2;
      }

      &-label {
        @include widget.label;
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

  &--revealed &-map {
    :deep(.maplibregl-canvas) {
      animation: reveal $reveal-duration cubic-bezier(0.4, 0, 0.2, 1) both;
    }

    :deep(.maplibregl-control-container),
    :deep(.App-map-marker) {
      opacity: 1;
      transition: opacity 0.8s $settle-delay ease-out;
    }
  }
}

@keyframes grid-in {
  from {
    opacity: 0;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes user-in {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
}

@keyframes user-ping {
  from {
    opacity: 0.9;
    transform: scale(0.3);
  }
  to {
    opacity: 0;
    transform: scale(2.4);
  }
}

// 150vmax reaches the farthest corner from any origin on the screen.
@keyframes reveal {
  from {
    clip-path: circle(0 at var(--reveal-x) var(--reveal-y));
  }
  to {
    clip-path: circle(150vmax at var(--reveal-x) var(--reveal-y));
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
  .App-grid,
  .App-ui,
  .App-map :deep(.maplibregl-canvas),
  .App-map :deep(.App-map-marker),
  .App-map :deep(.App-map-position-arrow),
  .App-map :deep(.App-map-position-cone),
  .App-map :deep(.App-map-position-ping) {
    animation: none !important;
    transition: none !important;
  }

  .App-map :deep(.maplibregl-canvas) {
    clip-path: none;
  }

  .App-map :deep(.App-map-position-ping) {
    display: none;
  }
}
</style>
