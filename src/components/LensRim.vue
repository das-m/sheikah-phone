<script setup lang="ts">
// `paused`: the animations rest (a modal covers the lens).
// `detected`: a known code is in view; the rim takes the detection color. The hold progress itself is the CSS variable
// `--hold` (0..1) on the parent, written from the script every frame by `ScanOverlay`.
defineProps<{ paused?: boolean; detected?: boolean }>()
</script>

<template>
  <div
    :class="['LensRim', { 'LensRim--paused': paused, 'LensRim--detected': detected }]"
    aria-hidden="true"
  >
    <div class="LensRim-glow"></div>
    <div class="LensRim-sweep"></div>
    <div class="LensRim-ring"></div>
    <svg class="LensRim-progress" viewBox="0 0 100 100">
      <circle class="LensRim-progress-arc" cx="50" cy="50" r="49" pathLength="1" />
    </svg>
  </div>
</template>

<style lang="scss" scoped>
// The rim of the lens: a ring with a soft glow and a slow light that circles the edge. It fills its parent, which
// is the round lens box. Mobile cost is kept low on purpose: two animated layers, and each animates only `opacity` or
// `transform` (the glow's shadow is painted once and only faded). A recognised code recolors it (`--rim-color`) and
// fills the progress arc while it is held.
.LensRim {
  --rim-color: var(--color-purple);

  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;

  &--detected {
    --rim-color: var(--color-secondary);
  }

  &-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid color-mix(in srgb, var(--rim-color) 75%, transparent);
    box-shadow: inset 0 0 1.2rem color-mix(in srgb, var(--rim-color) 35%, transparent);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  &-glow {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: 0 0 2rem 0.2rem color-mix(in srgb, var(--rim-color) 55%, transparent);
    animation: breathe 3.2s ease-in-out infinite;
  }

  // A bright arc that travels along the edge: a conic gradient, cut to a thin band by the mask.
  &-sweep {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      transparent 0 70%,
      color-mix(in srgb, var(--rim-color) 70%, white) 100%
    );
    mask-image: radial-gradient(closest-side, transparent 96%, #000 97%);
    will-change: transform;
    animation: orbit 7s linear infinite;
  }

  // The hold progress: an arc from the top, clockwise, over the ring. `--hold` is 0..1.
  &-progress {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    transform: rotate(-90deg);
    filter: drop-shadow(0 0 0.4rem var(--rim-color));

    &-arc {
      fill: none;
      stroke: var(--rim-color);
      stroke-width: 2.4;
      // butt caps: a round one would leave a dot at the start while the progress is 0
      stroke-linecap: butt;
      stroke-dasharray: 1;
      stroke-dashoffset: calc(1 - var(--hold, 0));
    }
  }

  &--paused &-glow,
  &--paused &-sweep {
    animation-play-state: paused;
  }
}

@keyframes breathe {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 1;
  }
}

@keyframes orbit {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .LensRim-glow,
  .LensRim-sweep {
    animation: none;
  }
}
</style>
