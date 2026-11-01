import { onMounted, onUnmounted } from 'vue'
import type { Vec3 } from '@/lib/gesture'

import soundFairy from '@/assets/audio/fairy.ogg'

const MASTER_GAIN = 0.7
/** The rate only glides again once it moved this far, so the audio thread is not fed a new event every frame. */
const RATE_STEP = 0.05
const RATE_GLIDE_S = 0.15

// An AudioBuffer works with any context, so the file is fetched and decoded once, not on every visit.
let bufferPromise: Promise<AudioBuffer> | null = null

function loadBuffer(context: AudioContext): Promise<AudioBuffer> {
  if (!bufferPromise) {
    bufferPromise = fetch(soundFairy)
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
 * Loops the fairy sound so that it comes from her. `update` takes her position in camera space
 * (x right, y up, z forward, metres): the listener is the phone itself, so it stays at the Web Audio defaults
 * (origin, facing -z) and only the source moves. Left/right works on phone speakers, front/back mostly on headphones.
 * It also takes the playback rate, so the sound speeds up and rises with her flight.
 * Nothing plays until the first `update` (she has a position and a rate by then), and it is silent while the page is hidden.
 */
export function useFairySound() {
  let ctx: AudioContext | null = null
  let panner: PannerNode | null = null
  let source: AudioBufferSourceNode | null = null
  let buffer: AudioBuffer | null = null
  let latestRate: number | null = null
  let glideRate = 0

  function resume() {
    if (!document.hidden) ctx?.resume().catch(() => {})
  }

  // Locking the phone or switching app must not leave her chiming from the pocket.
  function onVisibilityChange() {
    if (document.hidden) ctx?.suspend().catch(() => {})
    else resume()
  }

  /** Starts the loop once both the sound and her first rate are there, at that rate (no sweep from 1). */
  function start() {
    if (!ctx || !panner || !buffer || source || latestRate === null) return
    source = new AudioBufferSourceNode(ctx, { buffer, loop: true, playbackRate: latestRate })
    glideRate = latestRate
    source.connect(panner)
    source.start()
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
    document.addEventListener('visibilitychange', onVisibilityChange)

    try {
      const decoded = await loadBuffer(context)
      // Left the app while the sound was loading.
      if (ctx !== context) return
      buffer = decoded
      start()
    } catch {
      // No sound is not an error for the game.
    }
  })

  onUnmounted(() => {
    window.removeEventListener('pointerdown', resume)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    source?.stop()
    source = null
    panner = null
    buffer = null
    ctx?.close().catch(() => {})
    ctx = null
  })

  function update(camera: Vec3, playbackRate: number) {
    if (!panner || !ctx) return
    panner.positionX.value = camera.x
    panner.positionY.value = camera.y
    panner.positionZ.value = -camera.z
    latestRate = playbackRate
    if (!source) {
      start()
    } else if (Math.abs(playbackRate - glideRate) >= RATE_STEP) {
      glideRate = playbackRate
      source.playbackRate.setTargetAtTime(playbackRate, ctx.currentTime, RATE_GLIDE_S)
    }
  }

  return { update }
}
