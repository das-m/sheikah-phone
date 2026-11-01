import { onMounted, onUnmounted } from 'vue'
import type { Vec3 } from '@/lib/gesture'

import soundFairy from '@/assets/audio/fairy.ogg'

const MASTER_GAIN = 0.7

/**
 * Loops the fairy sound so that it comes from her. `update` takes her position in camera space
 * (x right, y up, z forward, metres): the listener is the phone itself, so it stays at the Web Audio defaults
 * (origin, facing -z) and only the source moves. Left/right works on phone speakers, front/back mostly on headphones.
 * It also takes the playback rate, so the sound speeds up and rises with her flight.
 */
export function useFairySound() {
  let ctx: AudioContext | null = null
  let panner: PannerNode | null = null
  let source: AudioBufferSourceNode | null = null

  function resume() {
    ctx?.resume().catch(() => {})
  }

  onMounted(async () => {
    if (typeof AudioContext === 'undefined') return
    const context = new AudioContext()
    ctx = context

    panner = new PannerNode(context, {
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      rolloffFactor: 1.2
    })
    panner.connect(new GainNode(context, { gain: MASTER_GAIN })).connect(context.destination)

    // The tap into the app usually counts as the gesture already; if not, the first touch does.
    resume()
    window.addEventListener('pointerdown', resume, { once: true })

    try {
      const response = await fetch(soundFairy)
      const buffer = await context.decodeAudioData(await response.arrayBuffer())
      // Left the app while the sound was loading.
      if (ctx !== context || !panner) return
      source = new AudioBufferSourceNode(context, { buffer, loop: true })
      source.connect(panner)
      source.start()
    } catch {
      // No sound is not an error for the game.
    }
  })

  onUnmounted(() => {
    window.removeEventListener('pointerdown', resume)
    source?.stop()
    source = null
    panner = null
    ctx?.close().catch(() => {})
    ctx = null
  })

  function update(camera: Vec3, playbackRate: number) {
    if (!panner || !ctx) return
    panner.positionX.value = camera.x
    panner.positionY.value = camera.y
    panner.positionZ.value = -camera.z
    // A short glide, so the pitch follows her speed without steps.
    source?.playbackRate.setTargetAtTime(playbackRate, ctx.currentTime, 0.15)
  }

  return { update }
}
