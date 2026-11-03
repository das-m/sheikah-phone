<script setup lang="ts">
import { computed } from 'vue'

import ScanlineOverlay from '@/components/ScanlineOverlay.vue'
import type { LoaderVariant } from '@/game/apps'

// `hack`: the switch between the two modes, a "hack" of the device (see the hack part of the styles).
// It takes the direction, since the colors and the logo turn from the old mode to the new one.
// `variant`: the look of an app's own loader. 'lens' is the Scanner app's: the same logo and timing, in purple (the color change happens mid-transition).
// `flash`: the pattern behind the eye flickers up and breathes. Only for the long transitions (the boot, the lens
// and the mode switch, which set it themselves); the ordinary one stays short.
const props = defineProps<{
  show?: boolean
  hack?: '' | 'to-yiga' | 'to-sheikah'
  variant?: LoaderVariant
  flash?: boolean
  // With the lens variant: leaving it, so the colors go from purple back to blue.
  reverse?: boolean
}>()

const isFlashing = computed(() => props.flash || !!props.hack || props.variant === 'lens')
</script>

<template>
  <!-- Must match the longest animation of each phase below. -->
  <Transition name="loader" :duration="{ enter: 750, leave: 650 }">
    <div
      v-if="show"
      :class="[
        'SheikahLoader',
        {
          'SheikahLoader--flash': isFlashing,
          'SheikahLoader--hack': hack,
          [`SheikahLoader--${hack}`]: hack,
          [`SheikahLoader--${variant}`]: variant && !hack,
          'SheikahLoader--reverse': reverse
        }
      ]"
    >
      <div class="SheikahLoader-logo">
        <div class="SheikahLoader-logo-ring SheikahLoader-logo-layer"></div>
        <div class="SheikahLoader-logo-pattern SheikahLoader-logo-layer"></div>
        <div class="SheikahLoader-logo-left SheikahLoader-logo-layer"></div>
        <div class="SheikahLoader-logo-main SheikahLoader-logo-layer"></div>
        <div class="SheikahLoader-logo-right SheikahLoader-logo-layer"></div>
      </div>
      <ScanlineOverlay v-if="hack" class="SheikahLoader-scan" />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
$ease-out: cubic-bezier(0.16, 1, 0.3, 1);

// The art is white; every layer is a mask colored by `--logo-color`, like the glow of the phone frame (`PhoneFrame`):
// the same variable (`--frame-glow`, else the mode color) and the same fade (`--color-fade`), so the logo and the frame
// change color together. `--logo-color` is a registered property (variables.scss), so it, and the glow made from it,
// fades instead of jumping.
@mixin mask($image) {
  -webkit-mask-image: $image;
  mask-image: $image;
}

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
    --logo-size: min(64vmin, 500px);
    --logo-color: var(--frame-glow, var(--color-primary));
    --logo-shadow: drop-shadow(
      0 0 calc(var(--logo-size) * 0.035) color-mix(in srgb, var(--logo-color) 60%, transparent)
    );
    transition: --logo-color var(--color-fade);
    // Where the pattern sits in the logo box, measured from the final composite: it is 92.4% of the box tall
    // (the art keeps its ratio), centered horizontally, and its top is 58.6 of 1000 units below the box top
    // (= 77.3% of the free height).
    --pattern-height: 92.4%;
    --pattern-y: 77.3%;
    // brightness of the pattern at rest (1 = as bright as the logo)
    --pattern-dim: 0.65;

    position: relative;
    width: var(--logo-size);
    aspect-ratio: 1/1;

    &-layer {
      position: absolute;
      inset: 0;
      background-color: var(--logo-color);
      -webkit-mask-position: center;
      mask-position: center;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-size: contain;
      mask-size: contain;
    }

    &-left,
    &-main,
    &-right {
      filter: var(--logo-shadow);
    }

    &-left {
      @include mask(url(@/assets/images/logo/sheikah-decor-left.svg));
    }

    &-main {
      @include mask(url(@/assets/images/logo/sheikah-main.svg));
    }

    &-right {
      @include mask(url(@/assets/images/logo/sheikah-decor-right.svg));
    }

    // The faint glow of the pattern behind the eye, once the logo is in place. It stays hidden until the eye
    // and the decor have arrived and settled (0.9 s), flickers up like a tube being lit (0.9 s), and then
    // breathes very softly. Opacity only, never scaled or moved, so it cannot look out of step with the logo.
    // It is set here and not on the enter state, because that state ends at 0.75 s and would cut it short.
    &-pattern {
      @include mask(url(@/assets/images/logo/sheikah-glow-pattern.svg));
      -webkit-mask-size: auto var(--pattern-height);
      mask-size: auto var(--pattern-height);
      -webkit-mask-position: 50% var(--pattern-y);
      mask-position: 50% var(--pattern-y);
      filter: brightness(var(--pattern-dim)) var(--logo-shadow);
      opacity: 0.3;
      // The ordinary transition is short (it has to stay in step with its sound): the pattern just fades in.
      animation: pattern-soft 0.4s 0.35s ease-out backwards;
    }

    // The ring is only the ping that leaves the circle on entry and exit; at rest it is invisible, so the
    // image is used once. Its line is at 40.4% of the image radius-wise, the logo's circle at 44.6% of the
    // box: 110% makes them coincide.
    &-ring {
      @include mask(url(@/assets/images/logo/sheikah-decor-glow.png));
      -webkit-mask-size: 110%;
      mask-size: 110%;
      opacity: 0;
    }
  }
}

// The special transitions (boot, lens, mode switch) run longer, so the pattern flickers up and breathes there.
.SheikahLoader--flash .SheikahLoader-logo-pattern {
  animation:
    pattern-in 0.9s 0.9s linear both,
    glow-idle 2.6s 1.8s ease-in-out infinite;
}

// Enter: the halo flares, the eye resolves out of a bright blur, the decor slides in from both sides.
.loader-enter-active {
  animation: backdrop-in 0.3s ease-out both;

  .SheikahLoader-logo-ring {
    animation: ring-ping 0.8s 0.3s ease-out both;
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

  // gone before the eye starts to swell
  .SheikahLoader-logo-pattern {
    animation: pattern-out 0.15s ease-out both;
  }

  .SheikahLoader-logo-ring {
    animation: ring-ping 0.65s ease-out both;
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

@keyframes pattern-soft {
  from {
    opacity: 0;
  }
}

// Flickers up: short, uneven bursts that settle at the resting opacity (0.3). Linear, so the bursts are abrupt.
@keyframes pattern-in {
  0% {
    opacity: 0;
  }
  7% {
    opacity: 0.28;
  }
  12% {
    opacity: 0;
  }
  20% {
    opacity: 0.12;
  }
  26% {
    opacity: 0.38;
  }
  31% {
    opacity: 0.02;
  }
  44% {
    opacity: 0.22;
  }
  52% {
    opacity: 0.4;
  }
  58% {
    opacity: 0.1;
  }
  74% {
    opacity: 0.34;
  }
  100% {
    opacity: 0.3;
  }
}

// Starts and ends at the resting opacity, so nothing jumps.
@keyframes glow-idle {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.42;
  }
}

@keyframes pattern-out {
  to {
    opacity: 0;
  }
}

// The ring leaves the circle outward and fades.
@keyframes ring-ping {
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

// The lens (Scanner app): like the hack, the colors change in the middle of the transition, together with the pattern's
// flicker (0.9 s). The logo and the phone frame take their color from the same variable (see the top), which `App.vue`
// switches at that moment, so they fade together; here only the backdrop is tinted: a purple one fades in over the blue
// one. `reverse` (leaving the lens) goes from purple back to blue. The end state is the look of the app on the side of
// the transition, so nothing jumps when the loader goes. The ring pings a second time on entry, as if the lens focused.
.SheikahLoader--lens {
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(34, 12, 66, 0.65), rgba(0, 0, 0, 0.8) 85%);
    opacity: 0;
    animation: hack-tint-in 0.9s 0.9s ease-in-out both;
  }

  &.SheikahLoader--reverse {
    &::before {
      opacity: 1;
      animation-name: hack-tint-out;
    }
  }

  // The second ping has no fill, so it does not hold the ring's opacity before it starts.
  &.loader-enter-active .SheikahLoader-logo-ring {
    animation:
      ring-ping 0.8s 0.3s ease-out both,
      ring-ping 0.8s 1.1s ease-out;
  }
}

// The "hack" (switch between the modes): the device is being taken over. After the logo has arrived in the old
// colors, scanlines come up and the logo glitches in short bursts, the whole logo (eye, decor, pattern) turns
// over (like an inverted cross) while the colors fade across (the variable of the logo follows the mode color), and the backdrop is tinted red (or back).
// Timeline, from the start:
//   0 - 0.75 s  the normal arrival       0.9 s  scanlines in, glitches begin (to 3.6 s)
//   1 - 2.4 s   logo turns               1.6 s  the UI colors switch and fade, logo and frame too (useYigaMode)
// The end state equals the static look of the mode (yiga.scss), so nothing jumps when the loader goes.
.SheikahLoader--hack {
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(58, 8, 10, 0.7), rgba(0, 0, 0, 0.85) 85%);
    opacity: 0;
  }

  .SheikahLoader-scan {
    animation: hack-scan-in 0.5s 0.9s ease-out both;
  }

  &.SheikahLoader--to-yiga {
    &::before {
      animation: hack-tint-in 1.4s 1s ease-in-out both;
    }

    .SheikahLoader-logo {
      animation:
        hack-glitch 2.7s 0.9s steps(1, end) both,
        hack-turn-to-yiga 1.4s 1s ease-in-out both;
    }
  }

  &.SheikahLoader--to-sheikah {
    &::before {
      opacity: 1;
      animation: hack-tint-out 1.4s 1s ease-in-out both;
    }

    .SheikahLoader-logo {
      animation:
        hack-glitch 2.7s 0.9s steps(1, end) both,
        hack-turn-to-sheikah 1.4s 1s ease-in-out both;
    }
  }
}

.loader-leave-active .SheikahLoader-scan {
  animation: hack-scan-out 0.4s ease-in both;
}

@keyframes hack-tint-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes hack-tint-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

// The whole logo upside down in Yiga mode (the static rule is in yiga.scss).
@keyframes hack-turn-to-yiga {
  from {
    rotate: 0deg;
  }
  to {
    rotate: 180deg;
  }
}

@keyframes hack-turn-to-sheikah {
  from {
    rotate: 180deg;
  }
  to {
    rotate: 0deg;
  }
}

// Short, abrupt bursts: the logo jumps sideways and drops out for a frame or two. `steps(1)` makes every
// keyframe hold until the next one, so the burst is a jolt, not a glide.
@keyframes hack-glitch {
  0%,
  9%,
  37%,
  61%,
  82%,
  100% {
    translate: 0 0;
    opacity: 1;
  }
  7% {
    translate: -2.5% 0;
    opacity: 0.55;
  }
  8% {
    translate: 3% 0;
    opacity: 1;
  }
  34% {
    translate: 2% -1%;
    opacity: 0.4;
  }
  35% {
    translate: -2% 0;
    opacity: 0.9;
  }
  58% {
    translate: -3% 1%;
    opacity: 0.5;
  }
  60% {
    translate: 2% 0;
    opacity: 1;
  }
  80% {
    translate: 1.5% 0;
    opacity: 0.6;
  }
}

@keyframes hack-scan-in {
  from {
    opacity: 0;
  }
}

@keyframes hack-scan-out {
  to {
    opacity: 0;
  }
}
</style>
