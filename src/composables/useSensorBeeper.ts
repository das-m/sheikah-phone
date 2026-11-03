import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { useCompass } from '@/composables/useCompass'
import { useSensorMode } from '@/composables/useSensorMode'
import {
  decoyTuning,
  onSensorArrived,
  SENSOR_FACING_RELEASE_DEG,
  SENSOR_FACING_TOLERANCE_DEG,
  sensorTuning
} from '@/game/sensors'
import { beepIntervalMs, beepVolume, foundRadius, isBeepAudible } from '@/lib/sensorBeep'

import soundSignal from '@/assets/audio/sensor-signal.ogg'

/** How often to look again while there is nothing to beep for (no sensor, no location, no GPS fix). */
const IDLE_CHECK_MS = 500
/** How often to look again while the phone points away from the target. */
const TURN_CHECK_MS = 250
/** The player has to leave the found radius by this much (metres) before the target counts as not reached again. */
const ARRIVED_RELEASE_METERS = 5
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
 * is to its location, and only while the phone points at it (the better the aim, the faster; `lib/sensorBeep.ts`,
 * numbers in `game/sensors.ts`). `arrived` is true while the player is inside the found radius (which follows the GPS
 * accuracy); coming in vibrates and calls `onSensorArrived`. Silent without an active sensor, without a location on it and without a GPS fix, and
 * while the page is hidden. Call in `setup` (it uses the GPS and compass composables). The tap that opened the map
 * counts as the gesture audio needs; if not, the first touch does. Returns `beepCount`, which goes up with every beep that
 * actually sounds, so the screen can flash its sensor icon in step.
 */
export function useSensorBeeper() {
  const beepCount = ref(0)
  const { active } = useSensorMode()
  // The target of an event without a location is never read (see `step`), the placeholder only satisfies the type.
  const { distance, accuracy, relativeBearing } = useCompass(
    () => active.value?.location ?? { lat: 0, lng: 0 }
  )
  // A decoy ("Niete") only gets a very quiet, steady signal and can never be reached.
  const tuning = computed(() => (active.value?.decoy ? decoyTuning : sensorTuning))
  const radius = computed(() => foundRadius(accuracy.value, tuning.value))

  // The player came into the found radius (and stays "arrived" until clearly out of it again, so GPS jitter does not
  // toggle it). Reset when the sensor is switched off or another one is activated.
  const arrived = ref(false)
  watch(
    [active, distance, radius],
    ([sensor, meters, found]) => {
      if (!sensor?.location || sensor.decoy || meters === null) {
        arrived.value = false
      } else if (!arrived.value && meters <= found) {
        arrived.value = true
        navigator.vibrate?.([200, 100, 200])
        onSensorArrived(sensor)
      } else if (arrived.value && meters > found + ARRIVED_RELEASE_METERS) {
        arrived.value = false
      }
    },
    { immediate: true }
  )

  // With hysteresis: starts within the tolerance, stops only past the release angle.
  let facing = false

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
    beepCount.value++
  }

  /** One beep (if there is something to measure), then schedules the next. Interval and volume are read each time. */
  function step() {
    let wait = IDLE_CHECK_MS
    const sensor = active.value
    if (sensor?.location && distance.value !== null) {
      // No compass (desktop, iOS): count as pointing straight at it, or it would stay silent forever.
      const offset = relativeBearing.value === null ? 0 : Math.abs(relativeBearing.value)
      facing = offset <= (facing ? SENSOR_FACING_RELEASE_DEG : SENSOR_FACING_TOLERANCE_DEG)
      if (isBeepAudible(distance.value, facing, radius.value)) {
        beep(beepVolume(distance.value, radius.value, tuning.value))
        wait = beepIntervalMs(distance.value, offset, radius.value, tuning.value)
      } else {
        // Pointing elsewhere: silent, but look again soon so the signal starts as the player turns.
        wait = TURN_CHECK_MS
      }
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

  return { beepCount, distance, arrived }
}
