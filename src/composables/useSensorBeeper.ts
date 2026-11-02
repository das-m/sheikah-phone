import { onMounted, onUnmounted } from 'vue'

import { useCompass } from '@/composables/useCompass'
import { useSensorMode } from '@/composables/useSensorMode'
import { SENSOR_FACING_TOLERANCE_DEG, sensorTuning } from '@/game/sensors'
import { beepIntervalMs, beepVolume } from '@/lib/sensorBeep'

import soundSignal from '@/assets/audio/sensor-signal.ogg'

/** How often to look again while there is nothing to beep for (no sensor, no location, no GPS fix). */
const IDLE_CHECK_MS = 500
/** The signal is longer than the fastest interval: at most this many beeps ring at once. */
const MAX_VOICES = 2
const MASTER_GAIN = 0.9

// An AudioBuffer works with any context, so it is fetched and decoded once, not on every visit.
let bufferPromise: Promise<AudioBuffer> | null = null

function loadBuffer(context: AudioContext): Promise<AudioBuffer> {
  if (!bufferPromise) {
    bufferPromise = fetch(soundSignal)
      .then((response) => response.arrayBuffer())
      .then((data) => context.decodeAudioData(data))
      .catch((error) => {
        bufferPromise = null
        throw error
      })
  }
  return bufferPromise
}

/**
 * The sonar of the active sensor (`useSensorMode`): a repeating beep that gets faster and louder the closer the player
 * is to its location, and louder (and a little faster) while the phone points at it (`lib/sensorBeep.ts`,
 * numbers in `game/sensors.ts`). Silent without an active sensor, without a location on it and without a GPS fix, and
 * while the page is hidden. Call in `setup` (it uses the GPS and compass composables). The tap that opened the map
 * counts as the gesture audio needs; if not, the first touch does.
 */
export function useSensorBeeper() {
  const { active } = useSensorMode()
  // The target of an event without a location is never read (see `step`), the placeholder only satisfies the type.
  const { distance, isFacingTarget, heading } = useCompass(
    () => active.value?.location ?? { lat: 0, lng: 0 },
    SENSOR_FACING_TOLERANCE_DEG
  )

  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let buffer: AudioBuffer | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let voices = 0

  function resume() {
    if (!document.hidden) ctx?.resume().catch(() => {})
  }

  function onVisibilityChange() {
    if (document.hidden) ctx?.suspend().catch(() => {})
    else resume()
  }

  function beep(volume: number) {
    if (!ctx || !master || !buffer || ctx.state !== 'running' || voices >= MAX_VOICES) return
    const gain = new GainNode(ctx, { gain: volume })
    const source = new AudioBufferSourceNode(ctx, { buffer })
    source.connect(gain).connect(master)
    voices++
    source.onended = () => {
      voices--
      source.disconnect()
      gain.disconnect()
    }
    source.start()
  }

  /** One beep (if there is something to measure), then schedules the next. Interval and volume are read each time. */
  function step() {
    let wait = IDLE_CHECK_MS
    const sensor = active.value
    if (sensor?.location && distance.value !== null) {
      // No compass (desktop, iOS): do not punish it with the quiet off-course volume.
      const facing = heading.value === null || isFacingTarget.value
      beep(beepVolume(distance.value, facing, sensorTuning))
      wait = beepIntervalMs(distance.value, facing, sensorTuning)
    }
    timer = setTimeout(step, wait)
  }

  onMounted(async () => {
    if (typeof AudioContext === 'undefined') return
    const context = new AudioContext()
    ctx = context
    master = new GainNode(context, { gain: MASTER_GAIN })
    master.connect(context.destination)

    resume()
    window.addEventListener('pointerdown', resume, { once: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    try {
      const decoded = await loadBuffer(context)
      // Left the map while the sound was loading.
      if (ctx !== context) return
      buffer = decoded
    } catch {
      // A missing sound is not an error for the game.
      return
    }
    step()
  })

  onUnmounted(() => {
    if (timer !== null) clearTimeout(timer)
    timer = null
    window.removeEventListener('pointerdown', resume)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    master = null
    buffer = null
    ctx?.close().catch(() => {})
    ctx = null
  })
}
