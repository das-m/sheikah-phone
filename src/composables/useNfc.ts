import { onUnmounted, ref } from 'vue'
import { decodeRecords, type NfcReading } from '@/lib/nfc'

export type NfcStatus = 'unsupported' | 'idle' | 'scanning' | 'denied' | 'error'

/**
 * Web NFC reader (Android Chrome). `start()` must be called from a user gesture, because
 * the browser asks for permission on the first scan. Scanning stops on unmount.
 */
export function useNfc() {
  const status = ref<NfcStatus>('NDEFReader' in window ? 'idle' : 'unsupported')
  /** Readings of the most recent tag. */
  const readings = ref<NfcReading[]>([])
  /** Counts every successful tag read, so the UI can react to the same tag read twice. */
  const readCount = ref(0)
  const hasReadError = ref(false)

  let abort: AbortController | null = null

  async function start() {
    if (status.value !== 'idle' && status.value !== 'error') return
    abort = new AbortController()
    try {
      const reader = new NDEFReader()
      reader.onreading = (event) => {
        hasReadError.value = false
        readings.value = decodeRecords(event.message.records)
        readCount.value++
      }
      reader.onreadingerror = () => {
        hasReadError.value = true
      }
      await reader.scan({ signal: abort.signal })
      status.value = 'scanning'
    } catch (error) {
      status.value =
        error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'error'
    }
  }

  function stop() {
    abort?.abort()
    abort = null
    if (status.value === 'scanning') status.value = 'idle'
  }

  onUnmounted(stop)

  return { status, readings, readCount, hasReadError, start, stop }
}
