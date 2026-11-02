import { onMounted, onUnmounted } from 'vue'
import type { Vec3 } from '@/lib/gesture'

import soundFairyAlarm from '@/assets/audio/fairy-alarm-01.ogg'
import soundFairyFloat from '@/assets/audio/fairy-float.ogg'
import soundFairyHello from '@/assets/audio/fairy-hello.ogg'
import soundFairyHey from '@/assets/audio/fairy-hey.ogg'
import soundFairyIn1 from '@/assets/audio/fairy-in-01.ogg'
import soundFairyIn2 from '@/assets/audio/fairy-in-02.ogg'
import soundFairyOut1 from '@/assets/audio/fairy-out-01.ogg'
import soundFairyOut2 from '@/assets/audio/fairy-out-02.ogg'
import soundFairyLook1 from '@/assets/audio/fairy-look-01.ogg'
import soundFairyLook2 from '@/assets/audio/fairy-look-02.ogg'
import soundFairyLook3 from '@/assets/audio/fairy-look-03.ogg'
import soundFairySad from '@/assets/audio/fairy-sad.ogg'
import soundFairyMove1 from '@/assets/audio/fairy-sound-01.ogg'
import soundFairyMove2 from '@/assets/audio/fairy-sound-02.ogg'
import soundFairyMove3 from '@/assets/audio/fairy-sound-03.ogg'

const MASTER_GAIN = 0.7
/** The rate only glides again once it moved this far, so the audio thread is not fed a new event every frame. */
const RATE_STEP = 0.05
const RATE_GLIDE_S = 0.15
const LOUDNESS_STEP = 0.02
const LOUDNESS_GLIDE_S = 0.25

/** Her one-shot sounds. A voice with several files plays one of them, never the same twice in a row. */
const voiceUrls = {
  /** The game starts and she flies away after it. */
  hey: [soundFairyHey],
  /** First contact. */
  hello: [soundFairyHello],
  /** She was found. */
  alarm: [soundFairyAlarm],
  /** The player lost her. */
  sad: [soundFairySad],
  /** She starts her next movement. */
  move: [soundFairyMove1, soundFairyMove2, soundFairyMove3],
  /** She calls "Look!" from her hiding place. */
  look: [soundFairyLook1, soundFairyLook2, soundFairyLook3],
  /** She appears at her hiding place. */
  in: [soundFairyIn1, soundFairyIn2],
  /** She flies away. */
  out: [soundFairyOut1, soundFairyOut2]
}

export type FairyVoice = keyof typeof voiceUrls

const voiceNames = Object.keys(voiceUrls) as FairyVoice[]

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
 * Her sounds: a floating loop that comes from her, plus one-shot voices (`play`) through the same 3D panner, so they
 * come from where she is. `update` takes her position in camera space
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
  let voices: Partial<Record<FairyVoice, AudioBuffer[]>> = {}
  const lastIndex: Partial<Record<FairyVoice, number>> = {}
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
    const settled = async (urls: readonly string[]) =>
      (await Promise.allSettled(urls.map(loadBuffer))).flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : []
      )
    const [loop, ...loaded] = await Promise.all([
      settled([soundFairyFloat]),
      ...voiceNames.map((name) => settled(voiceUrls[name]))
    ])
    // Left the app while the sounds were loading.
    if (ctx !== context) return
    buffer = loop[0] ?? null
    voices = Object.fromEntries(voiceNames.map((name, i) => [name, loaded[i]]))
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
    voices = {}
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

  /** Volume of the loop, 0..1 (the voices are not affected). */
  function setLoudness(value: number) {
    if (Math.abs(value - loudness) < LOUDNESS_STEP) return
    loudness = value
    if (ctx && loopGain) loopGain.gain.setTargetAtTime(value, ctx.currentTime, LOUDNESS_GLIDE_S)
  }

  /** One of her voices, from where she is: call it after `update`, so that it uses her current position. */
  function play(voice: FairyVoice) {
    const options = voices[voice]
    if (!ctx || !panner || !options?.length || ctx.state !== 'running') return
    let index = Math.floor(Math.random() * options.length)
    if (index === lastIndex[voice] && options.length > 1) index = (index + 1) % options.length
    lastIndex[voice] = index
    const shot = new AudioBufferSourceNode(ctx, { buffer: options[index] })
    shot.connect(panner)
    shot.start()
  }

  return { update, setLoudness, play }
}
