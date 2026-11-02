<script setup lang="ts">
// `on`: the frame is built. It stays dark until then (the boot screen is black) and comes together once, when this
// turns true: the whole stone frame (corners and strips, one piece of art) slides in together, the top edge from
// above and the bottom edge from below, and the glow lights up after it.
defineProps<{ on?: boolean }>()

const corners = ['tl', 'tr', 'br', 'bl']
</script>

<template>
  <div :class="['PhoneFrame', { 'PhoneFrame--on': on }]">
    <!-- stone first, the glow above it -->
    <div
      v-for="set in ['stone', 'glow']"
      :key="set"
      :class="['PhoneFrame-layer', `PhoneFrame-layer--${set}`]"
    >
      <div
        v-for="corner in corners"
        :key="corner"
        :class="['PhoneFrame-corner', `PhoneFrame-corner--${corner}`]"
      ></div>
      <div class="PhoneFrame-strip PhoneFrame-strip--top"></div>
      <div class="PhoneFrame-strip PhoneFrame-strip--bottom"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/frame';

// The glow is white art, colored by the mode through a mask.
.PhoneFrame {
  position: fixed;
  z-index: 100;
  inset: 0;
  pointer-events: none;

  &-layer {
    position: absolute;
    inset: 0;
  }

  // Which edge a stone slides in from (the same distance for all, see `frame-stone-in`).
  &-corner--tl,
  &-corner--tr,
  &-strip--top {
    --from-y: -1;
  }

  &-corner--bl,
  &-corner--br,
  &-strip--bottom {
    --from-y: 1;
  }

  &-layer--stone {
    .PhoneFrame-corner--tl {
      @include frame.corner('corner-tl', 'stone');
    }

    .PhoneFrame-corner--tr {
      @include frame.corner('corner-tr', 'stone');
    }

    .PhoneFrame-corner--br {
      @include frame.corner('corner-br', 'stone');
    }

    .PhoneFrame-corner--bl {
      @include frame.corner('corner-bl', 'stone');
    }

    .PhoneFrame-strip--top {
      @include frame.strip(top, 'stone');
    }

    .PhoneFrame-strip--bottom {
      @include frame.strip(bottom, 'stone');
    }
  }

  &-layer--glow {
    // One opacity animation on the whole layer: cheap, and all glow pieces breathe in sync.
    animation: glow-breathe 4.5s ease-in-out infinite;

    .PhoneFrame-corner,
    .PhoneFrame-strip {
      // `--frame-glow` is set on <html> by an app that wants its own glow (`useFrameGlow`).
      background-color: var(--frame-glow, var(--color-primary));
      transition: background-color 0.5s;
    }

    .PhoneFrame-corner--tl {
      @include frame.corner('corner-tl', 'glow', $mask: true);
    }

    .PhoneFrame-corner--tr {
      @include frame.corner('corner-tr', 'glow', $mask: true);
    }

    .PhoneFrame-corner--br {
      @include frame.corner('corner-br', 'glow', $mask: true);
    }

    .PhoneFrame-corner--bl {
      @include frame.corner('corner-bl', 'glow', $mask: true);
    }

    .PhoneFrame-strip--top {
      @include frame.strip(top, 'glow', $mask: true);
    }

    .PhoneFrame-strip--bottom {
      @include frame.strip(bottom, 'glow', $mask: true);
    }
  }
}

// Build-up (the layers' own animations stay free for the glow's breathing). Without `--on` everything is dark.
.PhoneFrame:not(.PhoneFrame--on) {
  .PhoneFrame-layer--stone,
  .PhoneFrame-layer--glow .PhoneFrame-corner,
  .PhoneFrame-layer--glow .PhoneFrame-strip {
    opacity: 0;
  }
}

.PhoneFrame--on {
  // The frame is one piece of art (corners and strips are only split for the screen sizes), so the stone moves
  // as one: every piece of the top edge slides down and every piece of the bottom edge slides up by the same
  // distance, on the same timing, so the edges stay rigid. Heavy stone: it settles without a bounce.
  .PhoneFrame-layer--stone {
    .PhoneFrame-corner,
    .PhoneFrame-strip {
      // `backwards`: the end state is the plain style, so no finished animation stays on the pieces.
      animation: frame-stone-in 1.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    }
  }

  // The glow lights up last, like a tube: uneven bursts that settle at full strength.
  .PhoneFrame-layer--glow {
    .PhoneFrame-corner,
    .PhoneFrame-strip {
      animation: frame-glow-in 1.6s 1.6s linear both;
    }
  }
}

// 500 source pixels clears the tallest corner (490), so every piece starts fully off screen.
@keyframes frame-stone-in {
  from {
    transform: translateY(calc(var(--from-y) * 500 * var(--u)));
  }
  to {
    transform: none;
  }
}

@keyframes frame-glow-in {
  0% {
    opacity: 0;
  }
  8% {
    opacity: 0.6;
  }
  14% {
    opacity: 0;
  }
  30% {
    opacity: 0.3;
  }
  38% {
    opacity: 0.9;
  }
  44% {
    opacity: 0.1;
  }
  64% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

// Breathing: a smooth swell in, a short hold at the top, a slower fade out.
@keyframes glow-breathe {
  0%,
  100% {
    opacity: 0.45;
  }
  40%,
  50% {
    opacity: 1;
  }
}
</style>
