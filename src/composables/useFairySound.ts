import { onMounted, onUnmounted } from 'vue'
import type { Vec3 } from '@/lib/gesture'

const MASTER_GAIN = 0.08

/**
 * A shimmering chime that sounds as if it came from the fairy. `update` takes her position in camera space
 * (x right, y up, z forward, metres): the listener is the phone itself, so it stays at the Web Audio defaults
 * (origin, facing -z) and only the source moves. Left/right works on phone speakers, front/back mostly on headphones.
 */
export function useFairySound() {
  let ctx: AudioContext | null = null
  let panner: PannerNode | null = null
  let oscillators: OscillatorNode[] = []

  function resume() {
    ctx?.resume().catch(() => {})
  }

  onMounted(() => {
    if (typeof AudioContext === 'undefined') return
    ctx = new AudioContext()

    panner = new PannerNode(ctx, {
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      rolloffFactor: 1.2
    })
    const master = new GainNode(ctx, { gain: MASTER_GAIN })
    panner.connect(master).connect(ctx.destination)

    // Two detuned sines; a slow LFO on the gain makes them shimmer, a small one on the pitch makes them wobble.
    const shimmer = new GainNode(ctx, { gain: 0.5 })
    shimmer.connect(panner)
    const shimmerLfo = new OscillatorNode(ctx, { frequency: 3.1 })
    shimmerLfo.connect(new GainNode(ctx, { gain: 0.5 })).connect(shimmer.gain)
    oscillators.push(shimmerLfo)

    for (const [frequency, wobbleHz] of [
      [1800, 0.7],
      [2630, 1.1]
    ]) {
      const tone = new OscillatorNode(ctx, { frequency })
      const wobble = new OscillatorNode(ctx, { frequency: wobbleHz })
      wobble.connect(new GainNode(ctx, { gain: 25 })).connect(tone.frequency)
      tone.connect(shimmer)
      oscillators.push(tone, wobble)
    }
    oscillators.forEach((oscillator) => oscillator.start())

    // The tap into the app usually counts as the gesture already; if not, the first touch does.
    resume()
    window.addEventListener('pointerdown', resume, { once: true })
  })

  onUnmounted(() => {
    window.removeEventListener('pointerdown', resume)
    oscillators.forEach((oscillator) => oscillator.stop())
    oscillators = []
    panner = null
    ctx?.close().catch(() => {})
    ctx = null
  })

  function update(camera: Vec3) {
    if (!panner) return
    panner.positionX.value = camera.x
    panner.positionY.value = camera.y
    panner.positionZ.value = -camera.z
  }

  return { update }
}
