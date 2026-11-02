<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

import ScanlineOverlay from '@/components/ScanlineOverlay.vue'
import SheikahLoader from '@/components/SheikahLoader.vue'
import { useBoot } from '@/composables/useBoot'
import { useYigaMode } from '@/composables/useYigaMode'
import { playOpen } from '@/lib/uiSounds'

// `ready`: the boot is over and the screen starts to dissolve (the home screen can be mounted under it).
// `done`: the dissolve is over and the screen can be removed.
// `frame`: the frame of the slate starts to draw in (it sits above this screen, see `PhoneFrame`).
const emit = defineEmits<{ frame: []; ready: []; done: [] }>()

// Keep in step with `boot-out` below.
const LEAVE_MS = 1200

const { mode } = useYigaMode()
const { isLogoOn, isFrameOn, isFinished, skip } = useBoot()

// The screen starts black. The logo is the one of the other transitions (same place, same enter and leave):
// it plays its enter animation when switched on, once its art is loaded (so it does not flicker in).
const isLeaving = ref(false)
let leaveTimer: ReturnType<typeof setTimeout> | undefined

watch(isFrameOn, (on) => {
  if (on) emit('frame')
})

// Without a prior tap this makes no sound, except in the installed app.
watch(isLogoOn, (on) => {
  if (on) playOpen(mode.value)
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
    @click="skip"
  >
    <SheikahLoader :show="isLogoOn" />

    <ScanlineOverlay :class="['Boot-scanlines', { 'Boot-scanlines--on': isLogoOn }]" />
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

  // The tube comes on with the logo.
  &-scanlines {
    z-index: 7;
    opacity: 0;
    transition: opacity 1.5s ease-out;

    &--on {
      opacity: 1;
    }
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

@media (prefers-reduced-motion: reduce) {
  .Boot--leaving {
    animation-duration: 0.4s;
  }
}
</style>
