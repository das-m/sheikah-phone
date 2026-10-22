import { onMounted, onUnmounted, ref } from 'vue'
import type { LatLng } from '@/lib/geo'

/** Live device position. `position` stays null until the first fix. */
export function useGeolocation() {
  const position = ref<LatLng | null>(null)
  const error = ref<GeolocationPositionError | null>(null)
  const isSupported = 'geolocation' in navigator

  let watchId: number | null = null

  onMounted(() => {
    if (!isSupported) return
    watchId = navigator.geolocation.watchPosition(
      (p) => {
        position.value = { lat: p.coords.latitude, lng: p.coords.longitude }
        error.value = null
      },
      (e) => {
        error.value = e
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    )
  })

  onUnmounted(() => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  })

  return { position, error, isSupported }
}
