<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { useFairySound } from '@/composables/useFairySound'
import { useOrientation } from '@/composables/useOrientation'
import { fairyPosition, project, worldToCamera } from '@/lib/fairy'
import type { Vec3 } from '@/lib/gesture'

/** Glow diameter as a fraction of the screen height at 1 m; it shrinks with distance. */
const GLOW_SIZE = 0.18
const TRAIL_SPAWN_MS = 40
const TRAIL_LIFE_MS = 900
/** How far (m) a trail sparkle may drift from the fairy's path when it is born. */
const TRAIL_SPREAD = 0.05
const MAX_PIXEL_RATIO = 2

interface Sparkle {
  position: Vec3
  born: number
  phase: number
}

const canvasEl = ref<HTMLCanvasElement | null>(null)
const orientation = useOrientation()
const sound = useFairySound()

let frame = 0
let observer: ResizeObserver | null = null

/** A soft white-gold dot, drawn once and scaled for the fairy and each sparkle. */
function createGlowSprite(): HTMLCanvasElement {
  const size = 128
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = size
  const g = sprite.getContext('2d')!
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.15, 'rgba(255, 244, 200, 0.9)')
  gradient.addColorStop(0.4, 'rgba(255, 215, 120, 0.35)')
  gradient.addColorStop(1, 'rgba(255, 200, 100, 0)')
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

  function tick(now: number) {
    frame = requestAnimationFrame(tick)
    g!.globalAlpha = 1
    g!.globalCompositeOperation = 'source-over'
    g!.clearRect(0, 0, width, height)

    const current = orientation.current
    if (!current || width === 0) return
    const angle = screen.orientation?.angle ?? 0

    const t = (now - start) / 1000
    const position = fairyPosition(t)
    const camera = worldToCamera(position, current, angle)
    sound.update(camera)

    if (now - lastSpawn >= TRAIL_SPAWN_MS) {
      lastSpawn = now
      const jitter = () => (Math.random() - 0.5) * 2 * TRAIL_SPREAD
      sparkles.push({
        position: {
          x: position.x + jitter(),
          y: position.y + jitter(),
          z: position.z + jitter()
        },
        born: now,
        phase: Math.random() * Math.PI * 2
      })
    }
    while (sparkles.length > 0 && now - sparkles[0].born > TRAIL_LIFE_MS) sparkles.shift()

    g!.globalCompositeOperation = 'lighter'
    // The sparkles live in the world, so they stay put while the phone turns instead of sticking to the screen.
    for (const sparkle of sparkles) {
      const point = project(worldToCamera(sparkle.position, current, angle), width, height)
      if (!point) continue
      const age = (now - sparkle.born) / TRAIL_LIFE_MS
      const twinkle = 0.55 + 0.45 * Math.sin(now * 0.025 + sparkle.phase)
      drawGlow(
        point.x,
        point.y,
        height * GLOW_SIZE * point.scale * 0.3 * (1 - age),
        0.9 * (1 - age) * twinkle
      )
    }

    const point = project(camera, width, height)
    if (point) {
      const pulse = 1 + 0.12 * Math.sin(t * 6)
      drawGlow(point.x, point.y, height * GLOW_SIZE * point.scale * pulse, 1)
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
  <canvas ref="canvasEl" class="FairyOverlay"></canvas>
</template>

<style lang="scss" scoped>
.FairyOverlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
</style>
