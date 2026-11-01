import { onMounted, onUnmounted, ref, type Ref } from 'vue'

const defaultConstraints: MediaTrackConstraints = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1080 },
  height: { ideal: 1920 }
}

/**
 * Streams the rear camera into `videoEl` and releases it on unmount.
 * `constraints` replaces the default video constraints, e.g. a smaller frame for the scanner.
 */
export function useCamera(
  videoEl: Ref<HTMLVideoElement | null>,
  constraints: MediaTrackConstraints = defaultConstraints
) {
  const isReady = ref(false)
  const hasFailed = ref(false)

  let stream: MediaStream | null = null
  let isUnmounted = false

  function release() {
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
  }

  onMounted(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      hasFailed.value = true
      return
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: constraints })
      if (isUnmounted) {
        media.getTracks().forEach((track) => track.stop())
        return
      }
      stream = media
      if (videoEl.value) videoEl.value.srcObject = media
      isReady.value = true
    } catch {
      hasFailed.value = true
    }
  })

  onUnmounted(() => {
    isUnmounted = true
    release()
  })

  return { isReady, hasFailed }
}
