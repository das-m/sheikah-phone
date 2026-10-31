<script setup lang="ts">
defineProps({
  show: Boolean
})
</script>

<template>
  <!-- Must match the longest animation of each phase below. -->
  <Transition name="loader" :duration="{ enter: 750, leave: 650 }">
    <div class="SheikahLoader" v-if="show">
      <div class="SheikahLoader-logo">
        <div class="SheikahLoader-logo-glow SheikahLoader-logo-layer"></div>
        <div class="SheikahLoader-logo-left SheikahLoader-logo-layer"></div>
        <div class="SheikahLoader-logo-main SheikahLoader-logo-layer"></div>
        <div class="SheikahLoader-logo-right SheikahLoader-logo-layer"></div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
// The art has blue baked in (Yiga mode tints it with hue-rotate on `.SheikahLoader-logo`), so the glow
// uses that same blue and not the mode color, which would be tinted twice.
$glow-color: rgba(60, 211, 252, 0.6);
$ease-out: cubic-bezier(0.16, 1, 0.3, 1);

.SheikahLoader {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 5 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: radial-gradient(circle at center, rgba(6, 22, 52, 0.6), rgba(0, 0, 0, 0.8) 85%);

  &-logo {
    // Bound by the short side, so the logo fits in landscape too (it used to be width-bound and got cut off).
    --logo-size: min(80vmin, 500px);
    --logo-shadow: drop-shadow(0 0 calc(var(--logo-size) * 0.035) #{$glow-color});

    position: relative;
    width: var(--logo-size);
    aspect-ratio: 1/1;

    &-layer {
      position: absolute;
      inset: 0;
      background: transparent center no-repeat;
      background-size: contain;
    }

    &-left,
    &-main,
    &-right {
      filter: var(--logo-shadow);
    }

    &-left {
      background-image: url(@/assets/images/logo/sheikah-decor-left.svg);
    }

    &-main {
      background-image: url(@/assets/images/logo/sheikah-main.svg);
    }

    &-right {
      background-image: url(@/assets/images/logo/sheikah-decor-right.svg);
    }

    // Glowing ring that hugs the logo's circle (110% is what makes the two coincide, so it never scales
    // away from it while resting). A copy of it (::after) is sent outward as a ping on entry and exit.
    &-glow {
      background-image: url(@/assets/images/logo/sheikah-decor-glow.png);
      background-size: 110%;
      opacity: 0.75;
      // opacity only, and it starts and ends at the resting value, so entering and looping never jump
      animation: glow-idle 2.4s ease-in-out infinite;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: inherit;
        opacity: 0;
      }
    }
  }
}

// Enter: the halo flares, the eye resolves out of a bright blur, the decor slides in from both sides.
.loader-enter-active {
  animation: backdrop-in 0.3s ease-out both;

  .SheikahLoader-logo-glow {
    animation:
      glow-in 0.7s ease-out both,
      glow-idle 2.4s 0.7s ease-in-out infinite;

    // the ring locks on, and a ping leaves it
    &::after {
      animation: glow-ping 0.8s 0.3s ease-out both;
    }
  }

  .SheikahLoader-logo-main {
    animation: main-in 0.65s 0.05s $ease-out both;
  }

  .SheikahLoader-logo-left {
    animation: decor-in-left 0.6s 0.15s $ease-out both;
  }

  .SheikahLoader-logo-right {
    animation: decor-in-right 0.6s 0.15s $ease-out both;
  }
}

// Leave: the eye swells and dissolves, the decor drifts apart, a last shockwave of light, then the backdrop.
.loader-leave-active {
  animation: backdrop-out 0.45s 0.2s ease-in both;

  .SheikahLoader-logo-glow {
    animation: glow-out 0.45s ease-in both;

    &::after {
      animation: glow-ping 0.65s ease-out both;
    }
  }

  .SheikahLoader-logo-main {
    animation: main-out 0.5s ease-in both;
  }

  .SheikahLoader-logo-left {
    animation: decor-out-left 0.5s ease-in both;
  }

  .SheikahLoader-logo-right {
    animation: decor-out-right 0.5s ease-in both;
  }
}

@keyframes backdrop-in {
  from {
    opacity: 0;
  }
}

@keyframes backdrop-out {
  to {
    opacity: 0;
  }
}

@keyframes main-in {
  from {
    opacity: 0;
    transform: scale(1.3);
    filter: blur(10px) brightness(2.4) var(--logo-shadow);
  }
  60% {
    opacity: 1;
  }
  to {
    transform: scale(1);
    filter: blur(0) brightness(1) var(--logo-shadow);
  }
}

// filter lists only interpolate when both ends have the same functions, so `from` / `to` spell them all out
@keyframes main-out {
  from {
    opacity: 1;
    transform: scale(1);
    filter: blur(0) brightness(1) var(--logo-shadow);
  }
  to {
    opacity: 0;
    transform: scale(1.2);
    filter: blur(6px) brightness(2) var(--logo-shadow);
  }
}

@keyframes decor-in-left {
  from {
    opacity: 0;
    transform: translateX(-16%);
  }
}

@keyframes decor-in-right {
  from {
    opacity: 0;
    transform: translateX(16%);
  }
}

@keyframes decor-out-left {
  to {
    opacity: 0;
    transform: translateX(-10%);
  }
}

@keyframes decor-out-right {
  to {
    opacity: 0;
    transform: translateX(10%);
  }
}

// The ring settles onto the circle from just inside it, brighter than it will rest.
@keyframes glow-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  55% {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0.75;
    transform: scale(1);
  }
}

@keyframes glow-idle {
  0%,
  100% {
    opacity: 0.75;
  }
  50% {
    opacity: 0.95;
  }
}

// The ring brightens once more while the logo dissolves.
@keyframes glow-out {
  30% {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

// A copy of the ring that expands from the circle and fades.
@keyframes glow-ping {
  from {
    opacity: 0;
    transform: scale(1);
  }
  15% {
    opacity: 0.8;
  }
  to {
    opacity: 0;
    transform: scale(1.5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loader-enter-active,
  .loader-leave-active {
    &,
    .SheikahLoader-logo-layer {
      animation: none;
      transition: opacity 0.3s;
    }
  }

  .loader-enter-from,
  .loader-leave-to {
    opacity: 0;
  }
}
</style>
