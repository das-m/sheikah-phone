<script setup lang="ts">
// `on`: the frame is drawn in. It stays dark until then (the boot screen is black) and draws in once, when this
// turns true: the stone first (corners flare up, strips open from the middle), the glow lights up after it.
defineProps<{ on?: boolean }>()
</script>

<template>
  <div :class="['PhoneFrame', { 'PhoneFrame--on': on }]">
    <!-- stone first, the glow above it -->
    <div
      v-for="set in ['stone', 'glow']"
      :key="set"
      :class="['PhoneFrame-layer', `PhoneFrame-layer--${set}`]"
    >
      <div class="PhoneFrame-corners"></div>
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

  &-corners {
    position: absolute;
    inset: 0;
  }

  &-layer--stone {
    .PhoneFrame-corners {
      @include frame.corners('stone');
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

    .PhoneFrame-corners,
    .PhoneFrame-strip {
      // `--frame-glow` is set on <html> by an app that wants its own glow (`useFrameGlow`).
      background-color: var(--frame-glow, var(--color-primary));
      transition: background-color 0.5s;
    }

    .PhoneFrame-corners {
      @include frame.corners('glow', $mask: true);
    }

    .PhoneFrame-strip--top {
      @include frame.strip(top, 'glow', $mask: true);
    }

    .PhoneFrame-strip--bottom {
      @include frame.strip(bottom, 'glow', $mask: true);
    }
  }
}

// Draw-in (the layers' own animations stay free for the glow's breathing). Without `--on` everything is dark.
.PhoneFrame:not(.PhoneFrame--on) {
  .PhoneFrame-corners,
  .PhoneFrame-strip {
    opacity: 0;
  }
}

.PhoneFrame--on {
  .PhoneFrame-layer--stone {
    .PhoneFrame-corners {
      animation: frame-corners-in 1.8s ease-out both;
    }

    .PhoneFrame-strip {
      animation: frame-strip-in 2s 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
  }

  // The glow lights up last, like a tube: uneven bursts that settle at full strength.
  .PhoneFrame-layer--glow {
    .PhoneFrame-corners,
    .PhoneFrame-strip {
      animation: frame-glow-in 1.6s 1.6s linear both;
    }
  }
}

@keyframes frame-corners-in {
  from {
    opacity: 0;
    filter: brightness(3);
  }
  to {
    opacity: 1;
    filter: brightness(1);
  }
}

@keyframes frame-strip-in {
  from {
    opacity: 0;
    clip-path: inset(0 50% 0 50%);
  }
  30% {
    opacity: 1;
  }
  to {
    opacity: 1;
    clip-path: inset(0);
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

@media (prefers-reduced-motion: reduce) {
  .PhoneFrame-layer--glow {
    animation: none;
  }

  .PhoneFrame--on {
    .PhoneFrame-corners,
    .PhoneFrame-strip {
      animation: none;
    }
  }
}
</style>
