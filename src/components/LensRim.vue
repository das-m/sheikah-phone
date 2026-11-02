<script setup lang="ts">
// `paused`: the animations rest (a modal covers the lens).
defineProps<{ paused?: boolean }>()
</script>

<template>
  <div :class="['LensRim', { 'LensRim--paused': paused }]" aria-hidden="true">
    <div class="LensRim-glow"></div>
    <div class="LensRim-sweep"></div>
    <div class="LensRim-ring"></div>
  </div>
</template>

<style lang="scss" scoped>
// The rim of the lens: a purple ring with a soft glow and a slow light that circles the edge. It fills its parent, which
// is the round lens box. Mobile cost is kept low on purpose: two animated layers, and each animates only `opacity` or
// `transform` (the glow's shadow is painted once and only faded).
.LensRim {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;

  &-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid color-mix(in srgb, var(--color-purple) 75%, transparent);
    box-shadow: inset 0 0 1.2rem color-mix(in srgb, var(--color-purple) 35%, transparent);
  }

  &-glow {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: 0 0 2rem 0.2rem color-mix(in srgb, var(--color-purple) 55%, transparent);
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
      color-mix(in srgb, var(--color-purple) 70%, white) 100%
    );
    mask-image: radial-gradient(closest-side, transparent 96%, #000 97%);
    will-change: transform;
    animation: orbit 7s linear infinite;
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
