<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

import ScanlineOverlay from '@/components/ScanlineOverlay.vue'
import SheikahLoader from '@/components/SheikahLoader.vue'
import { useBoot } from '@/composables/useBoot'
import { playBoot } from '@/lib/uiSounds'

// `ready`: the boot is over and the screen starts to dissolve (the home screen can be mounted under it).
// `done`: the dissolve is over and the screen can be removed.
// `frame`: the frame of the slate starts to draw in (it sits above this screen, see `PhoneFrame`).
const emit = defineEmits<{ frame: []; ready: []; done: [] }>()

// Keep in step with `boot-out` below.
const LEAVE_MS = 1200

const { isLogoOn, isScreenOn, isFrameOn, isFinished } = useBoot()

// The screen starts black. The frame draws in first and its glow blinks on; then the screen turns on (the tube
// comes up) and the logo appears on it: the one of the other transitions (same place, same enter and leave),
// which plays its enter animation.
const isLeaving = ref(false)
let leaveTimer: ReturnType<typeof setTimeout> | undefined

// The boot sound starts with the frame and runs under the whole sequence. Without a prior tap it makes no sound,
// except in the installed app.
watch(isFrameOn, (on) => {
  if (!on) return
  emit('frame')
  playBoot()
})

watch(isFinished, (finished) => {
  if (!finished) return
  isLeaving.value = true
  emit('ready')
  leaveTimer = setTimeout(() => emit('done'), LEAVE_MS)
})

onUnmounted(() => clearTimeout(leaveTimer))
</script>

<template>
  <div
    :class="['Boot', { 'Boot--leaving': isLeaving }]"
    role="status"
    aria-label="Die Sheikah-Tafel startet"
  >
    <SheikahLoader :show="isLogoOn" flash />

    <ScanlineOverlay :class="['Boot-scanlines', { 'Boot-scanlines--on': isScreenOn }]" />
  </div>
</template>

<style lang="scss" scoped>
// Covers the screen of the slate, inside the frame, like the loader of the other transitions.
.Boot {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  // Black, like the splash screen the app comes from (the manifest's `background_color`).
  background: #000;

  &--leaving {
    pointer-events: none;
    animation: boot-out 1.2s ease-in both;
  }

  // The tube comes on before the logo: a short flicker that settles.
  &-scanlines {
    z-index: 7;
    opacity: 0;

    &--on {
      animation: boot-screen-on 0.9s linear both;
    }
  }
}

@keyframes boot-screen-on {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 0.8;
  }
  25% {
    opacity: 0.2;
  }
  45% {
    opacity: 1;
  }
  55% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

// The logo leaves with its own animation first; then the screen fades, as the home screen settles in.
@keyframes boot-out {
  0%,
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
