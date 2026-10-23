import { onMounted, onUnmounted, readonly, ref } from 'vue'
import type { LatLng } from '@/lib/geo'

// Module-level state: one GPS watcher serves every user of the composable (battery), and runs while at least one is mounted.
const position = ref<LatLng | null>(null)
/** Horizontal accuracy of the last fix in meters. */
const accuracy = ref<number | null>(null)
const error = ref<GeolocationPositionError | null>(null)
const isSupported = 'geolocation' in navigator

let watchId: number | null = null
let users = 0

function startWatching() {
  watchId = navigator.geolocation.watchPosition(
    (p) => {
      position.value = { lat: p.coords.latitude, lng: p.coords.longitude }
      accuracy.value = p.coords.accuracy
      error.value = null
    },
    (e) => {
      error.value = e
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
  )
}

/** Live device position. `position` stays null until the first fix. */
export function useGeolocation() {
  onMounted(() => {
    users += 1
    if (isSupported && watchId === null) startWatching()
  })

  onUnmounted(() => {
    users -= 1
    if (users === 0 && watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
  })

  return {
    position: readonly(position),
    accuracy: readonly(accuracy),
    error: readonly(error),
    isSupported
  }
}
