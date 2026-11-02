import { onMounted, onUnmounted } from 'vue'
import type { Vec3 } from '@/lib/gesture'

// The flying loop: the original sped up in the file (a: x4, b: x6 with a 40 Hz wing flutter, c: x8), so it sounds like
// an insect. TODO(fairy): pick one by ear, then delete the other two files and the old fairy.ogg.
import soundFairy from '@/assets/audio/fairy-fly-b.ogg'
import soundFairyHey from '@/assets/audio/fairy-hey.ogg'
import soundFairyMove1 from '@/assets/audio/fairy-sound-01.ogg'
import soundFairyMove2 from '@/assets/audio/fairy-sound-02.ogg'
import soundFairyMove3 from '@/assets/audio/fairy-sound-03.ogg'

const MASTER_GAIN = 0.7
/** The rate only glides again once it moved this far, so the audio thread is not fed a new event every frame. */
const RATE_STEP = 0.05
const RATE_GLIDE_S = 0.15
const LOUDNESS_STEP = 0.02
const LOUDNESS_GLIDE_S = 0.25

const moveUrls = [soundFairyMove1, soundFairyMove2, soundFairyMove3]

// An AudioBuffer works with any context, so each file is fetched and decoded once, not on every visit.
const bufferPromises = new Map<string, Promise<AudioBuffer>>()

// Decoded with a context of its own that is never closed: decoding with the mounted context would fail for everyone
// waiting on the shared promise when that screen is left before it finished.
let decoder: OfflineAudioContext | null = null

function loadBuffer(url: string): Promise<AudioBuffer> {
  let promise = bufferPromises.get(url)
  if (!promise) {
    promise = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => (decoder ??= new OfflineAudioContext(1, 1, 48000)).decodeAudioData(data))
      .catch((error) => {
        bufferPromises.delete(url)
        throw error
      })
    bufferPromises.set(url, promise)
  }
  return promise
}

/**
 * Her chime: a looping sound that comes from her, plus one-shots (her "hey", the sounds when she starts a new movement)
 * through the same 3D panner, so they come from where she is. `update` takes her position in camera space
 * (x right, y up, z forward, metres): the listener is the phone itself, so it stays at the Web Audio defaults
 * (origin, facing -z) and only the source moves. Left/right works on phone speakers, front/back mostly on headphones.
 * `update` also takes the playback rate of the loop, so it speeds up and rises with her flight, and `setLoudness`
 * is the loop's volume (she is quieter while hiding).
 * Nothing plays until the first `update` (she has a position and a rate by then), and it is silent while the page is hidden.
 */
export function useFairySound() {
  let ctx: AudioContext | null = null
  let panner: PannerNode | null = null
  let loopGain: GainNode | null = null
  let source: AudioBufferSourceNode | null = null
  let buffer: AudioBuffer | null = null
  let heyBuffer: AudioBuffer | null = null
  let moveBuffers: AudioBuffer[] = []
  let lastMove = -1
  let latestRate: number | null = null
  let glideRate = 0
  let loudness = 1

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
    if (!ctx || !loopGain || !buffer || source || latestRate === null) return
    source = new AudioBufferSourceNode(ctx, { buffer, loop: true, playbackRate: latestRate })
    glideRate = latestRate
    source.connect(loopGain)
    source.start()
  }

  function playOnce(sound: AudioBuffer | null) {
    if (!ctx || !panner || !sound || ctx.state !== 'running') return
    const shot = new AudioBufferSourceNode(ctx, { buffer: sound })
    shot.connect(panner)
    shot.start()
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
    loopGain = new GainNode(context, { gain: loudness })
    loopGain.connect(panner)

    // The tap into the app usually counts as the gesture already; if not, the first touch does.
    resume()
    window.addEventListener('pointerdown', resume, { once: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    // A missing sound is not an error for the game: each one is optional.
    const [loop, hey, ...moves] = await Promise.allSettled([
      loadBuffer(soundFairy),
      loadBuffer(soundFairyHey),
      ...moveUrls.map((url) => loadBuffer(url))
    ])
    // Left the app while the sounds were loading.
    if (ctx !== context) return
    if (loop.status === 'fulfilled') buffer = loop.value
    if (hey.status === 'fulfilled') heyBuffer = hey.value
    moveBuffers = moves.flatMap((move) => (move.status === 'fulfilled' ? [move.value] : []))
    start()
  })

  onUnmounted(() => {
    window.removeEventListener('pointerdown', resume)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    source?.stop()
    source = null
    panner = null
    loopGain = null
    buffer = null
    heyBuffer = null
    moveBuffers = []
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

  /** Volume of the loop, 0..1 (the one-shots are not affected). */
  function setLoudness(value: number) {
    if (Math.abs(value - loudness) < LOUDNESS_STEP) return
    loudness = value
    if (ctx && loopGain) loopGain.gain.setTargetAtTime(value, ctx.currentTime, LOUDNESS_GLIDE_S)
  }

  /** Her call, from where she is. Call after `update` so that it uses her current position. */
  function playHey() {
    playOnce(heyBuffer)
  }

  /** One of her three movement sounds, never the same twice in a row. */
  function playMove() {
    if (moveBuffers.length === 0) return
    let index = Math.floor(Math.random() * moveBuffers.length)
    if (index === lastMove && moveBuffers.length > 1) index = (index + 1) % moveBuffers.length
    lastMove = index
    playOnce(moveBuffers[index])
  }

  return { update, setLoudness, playHey, playMove }
}
