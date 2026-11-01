<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { useCompass } from '@/composables/useCompass'
import { useFairySound } from '@/composables/useFairySound'
import { useOrientation } from '@/composables/useOrientation'
import { fairyConfig, fairyGuideTarget } from '@/game/fairy'
import { fairyPlaybackRate, project, transformFromBasis, viewBasis } from '@/lib/fairy'
import { createFairyBrain } from '@/lib/fairyBrain'
import type { BrainOutput } from '@/lib/fairyBrain'
import { normalizeDegrees } from '@/lib/geo'
import type { Vec3 } from '@/lib/gesture'

/** Glow diameter as a fraction of the screen height at 1 m; it shrinks with distance. */
const GLOW_SIZE = 0.26
const TRAIL_SPAWN_MS = 40
const TRAIL_LIFE_MS = 900
/** How far (m) a trail sparkle may drift from the fairy's path when it is born. */
const TRAIL_SPREAD = 0.05
const BURST_COUNT = 36
const BURST_SPREAD = 0.35
const BURST_LIFE_MS = 1500
const MAX_PIXEL_RATIO = 2

interface Sparkle {
  position: Vec3
  born: number
  life: number
  /** 0..1, how visible she was when it was born (it does not glow while she is faded out). */
  strength: number
  phase: number
}

const canvasEl = ref<HTMLCanvasElement | null>(null)
const orientation = useOrientation()
const compass = useCompass(fairyGuideTarget)
const sound = useFairySound()
const brain = createFairyBrain(fairyConfig)

// TODO(fairy): temporary test link that skips to the next phase. Remove it, or show it in dev builds only.
const phaseLabel = ref('')
let shownLabel = ''

function labelFor(out: BrainOutput): string {
  switch (out.phase) {
    case 'swirl':
      return 'Schwärmen'
    case 'escape':
      return 'Fangen'
    case 'flee':
    case 'hidden':
      return `Verstecken ${out.finds + 1}`
    case 'befriend':
      return 'Freundschaft'
    case 'guide':
      return 'Wegweiserin'
  }
}

let frame = 0
let observer: ResizeObserver | null = null

/** A soft blue dot with a white core, drawn once and scaled for the fairy and each sparkle. */
function createGlowSprite(): HTMLCanvasElement {
  const size = 128
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = size
  const g = sprite.getContext('2d')!
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.15, 'rgba(200, 235, 255, 0.9)')
  gradient.addColorStop(0.4, 'rgba(90, 170, 255, 0.4)')
  gradient.addColorStop(1, 'rgba(60, 130, 255, 0)')
  g.fillStyle = gradient
  g.fillRect(0, 0, size, size)
  return sprite
}

onMounted(() => {
  const canvas = canvasEl.value
  const g = canvas?.getContext('2d')
  if (!canvas || !g) return

  const glow = createGlowSprite()
  const sparkles: Sparkle[] = []
  let width = 0
  let height = 0
  let lastSpawn = -Infinity
  let lastFrame: number | null = null
  const start = performance.now()

  observer = new ResizeObserver(() => {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    width = canvas.clientWidth
    height = canvas.clientHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    g.setTransform(ratio, 0, 0, ratio, 0, 0)
  })
  observer.observe(canvas)

  function drawGlow(x: number, y: number, diameter: number, alpha: number) {
    g!.globalAlpha = alpha
    g!.drawImage(glow, x - diameter / 2, y - diameter / 2, diameter, diameter)
  }

  function addSparkle(center: Vec3, spread: number, now: number, life: number, strength: number) {
    const jitter = () => (Math.random() - 0.5) * 2 * spread
    sparkles.push({
      position: { x: center.x + jitter(), y: center.y + jitter(), z: center.z + jitter() },
      born: now,
      life,
      strength,
      phase: Math.random() * Math.PI * 2
    })
  }

  function tick(now: number) {
    frame = requestAnimationFrame(tick)
    g!.globalAlpha = 1
    g!.globalCompositeOperation = 'source-over'
    g!.clearRect(0, 0, width, height)

    const current = orientation.current
    if (!current || width === 0) return
    const angle = screen.orientation?.angle ?? 0

    const t = (now - start) / 1000
    const dt = lastFrame === null ? 0 : (now - lastFrame) / 1000
    lastFrame = now

    // The compass bearing to the guide target, in the frame of the (relative) orientation she lives in.
    const bearing = compass.bearing.value
    const offset = orientation.northOffset
    const basis = viewBasis(current, angle)
    const out = brain.step({
      dt,
      view: basis,
      guideAzimuth: bearing !== null && offset !== null ? normalizeDegrees(bearing - offset) : null
    })
    const toCamera = transformFromBasis(basis)
    const camera = toCamera(out.position)

    sound.update(camera, fairyPlaybackRate(out.speed))
    sound.setLoudness(out.loudness)
    for (const event of out.events) {
      if (event === 'hey') sound.playHey()
      else if (event === 'move') sound.playMove()
      else
        for (let i = 0; i < BURST_COUNT; i++)
          addSparkle(out.position, BURST_SPREAD, now, BURST_LIFE_MS, 1)
    }

    const label = labelFor(out)
    if (label !== shownLabel) {
      shownLabel = label
      phaseLabel.value = label
    }

    if (out.alpha > 0.05 && now - lastSpawn >= TRAIL_SPAWN_MS) {
      lastSpawn = now
      addSparkle(out.position, TRAIL_SPREAD, now, TRAIL_LIFE_MS, out.alpha)
    }
    let kept = 0
    for (const sparkle of sparkles)
      if (now - sparkle.born <= sparkle.life) sparkles[kept++] = sparkle
    sparkles.length = kept

    g!.globalCompositeOperation = 'lighter'
    // The sparkles live in the world, so they stay put while the phone turns instead of sticking to the screen.
    for (const sparkle of sparkles) {
      const point = project(toCamera(sparkle.position), width, height)
      if (!point) continue
      const age = (now - sparkle.born) / sparkle.life
      const twinkle = 0.55 + 0.45 * Math.sin(now * 0.025 + sparkle.phase)
      drawGlow(
        point.x,
        point.y,
        height * GLOW_SIZE * point.scale * 0.3 * (1 - age),
        0.9 * (1 - age) * twinkle * sparkle.strength
      )
    }

    const point = project(camera, width, height)
    if (point && out.alpha > 0) {
      // The closer she is to being caught, the faster she pulses.
      const pulse = 1 + 0.12 * Math.sin(t * (6 + 10 * out.focusProgress))
      drawGlow(point.x, point.y, height * GLOW_SIZE * point.scale * out.glow * pulse, out.alpha)
    }
  }
  frame = requestAnimationFrame(tick)
})

onUnmounted(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div class="FairyOverlay">
    <canvas ref="canvasEl" class="FairyOverlay-canvas"></canvas>
    <button type="button" class="FairyOverlay-skip" @click="brain.skip()">
      Fee: {{ phaseLabel }} ▸
    </button>
  </div>
</template>

<style lang="scss" scoped>
.FairyOverlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  width: 100%;
  height: 100%;
  pointer-events: none;

  &-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  // Temporary test link, see the TODO in the script.
  &-skip {
    position: absolute;
    bottom: calc(var(--frame-bottom, 0px) + 0.5em);
    left: 50%;
    transform: translateX(-50%);
    padding: 0.4em 0.8em;
    background: transparent;
    border: 0;
    color: var(--color-primary);
    font: inherit;
    font-size: 0.8em;
    text-decoration: underline;
    opacity: 0.7;
    pointer-events: auto;
    cursor: pointer;
  }
}
</style>
