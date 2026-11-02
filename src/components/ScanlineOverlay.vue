<template>
  <div class="ScanlineOverlay" aria-hidden="true"></div>
</template>

<style lang="scss" scoped>
// Old-tube look for any surface: scanlines, darkened edges, a faint band that rolls down and a slight flicker.
// It fills its positioned parent and lets taps through. The parent sets the stacking (z-index), and the band
// takes the mode color, so it fits Yiga mode as well.
.ScanlineOverlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0 1px, transparent 1px 3px),
    radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.6));

  // the rolling band
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 24%;
    background: linear-gradient(
      transparent,
      color-mix(in srgb, var(--color-primary) 8%, transparent),
      transparent
    );
    animation: roll 6s linear infinite;
  }

  // the flicker: a black veil that dips in now and then
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: #000;
    opacity: 0;
    animation: flicker 7s steps(1) infinite;
  }
}

@keyframes roll {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(500%);
  }
}

// Mostly steady, with a few short dips like a worn supply.
@keyframes flicker {
  31% {
    opacity: 0.07;
  }
  32% {
    opacity: 0;
  }
  33% {
    opacity: 0.12;
  }
  34% {
    opacity: 0;
  }
  71% {
    opacity: 0.05;
  }
  72% {
    opacity: 0;
  }
}
</style>
