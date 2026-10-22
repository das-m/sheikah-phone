import { onUnmounted, ref } from 'vue'

export interface BeepParams {
  /** Delay until the next beep, measured from the start of the current one. */
  intervalMs: number
  /** 0..1 */
  volume: number
}

const PULSE_MS = 1000

/**
 * Repeating beep whose rate and volume are re-read from `getParams` before every beep.
 * `start()` must be called from a user gesture (AudioContext autoplay policy).
 * Everything stops on unmount.
 */
export function useBeeper(soundUrl: string, getParams: () => BeepParams) {
  const isRunning = ref(false)
  /** True for a moment after each beep, for driving CSS animations. */
  const isPulsing = ref(false)

  let context: AudioContext | null = null
  let buffer: AudioBuffer | null = null
  let beepTimer: ReturnType<typeof setTimeout> | undefined
  let pulseTimer: ReturnType<typeof setTimeout> | undefined

  async function load(ctx: AudioContext) {
    if (buffer) return
    const response = await fetch(soundUrl)
    buffer = await ctx.decodeAudioData(await response.arrayBuffer())
  }

  function beep() {
    if (!isRunning.value || !context || !buffer) return
    const { intervalMs, volume } = getParams()

    const source = context.createBufferSource()
    const gain = context.createGain()
    gain.gain.value = Math.min(1, Math.max(0, volume))
    source.buffer = buffer
    source.connect(gain).connect(context.destination)
    source.start()

    isPulsing.value = true
    clearTimeout(pulseTimer)
    pulseTimer = setTimeout(() => (isPulsing.value = false), PULSE_MS)

    beepTimer = setTimeout(beep, intervalMs)
  }

  async function start() {
    if (isRunning.value) return
    context ??= new AudioContext()
    await context.resume()
    await load(context)
    isRunning.value = true
    beep()
  }

  function stop() {
    isRunning.value = false
    isPulsing.value = false
    clearTimeout(beepTimer)
    clearTimeout(pulseTimer)
  }

  onUnmounted(() => {
    stop()
    context?.close()
    context = null
  })

  return { isRunning, isPulsing, start, stop }
}
