<template>
  <div class="PhoneFrame">
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
      background-color: var(--color-primary);
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
}
</style>
