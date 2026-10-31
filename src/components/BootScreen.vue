<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import ScanlineOverlay from '@/components/ScanlineOverlay.vue'
import SheikahLoader from '@/components/SheikahLoader.vue'
import { useBoot } from '@/composables/useBoot'
import { useYigaMode } from '@/composables/useYigaMode'
import { playOpen } from '@/lib/uiSounds'

// `ready`: the boot is over and the screen starts to dissolve (the home screen can be mounted under it).
// `done`: the dissolve is over and the screen can be removed.
const emit = defineEmits<{ ready: []; done: [] }>()

// Keep in step with `boot-out` below.
const LEAVE_MS = 1200

const { mode } = useYigaMode()
const { progress, isFinished, skip } = useBoot()

// The logo is the one of the other transitions (same place, same enter and leave). It plays its enter
// animation when switched on, so it starts off and comes on with the mount.
const showLogo = ref(false)
const isLeaving = ref(false)
let leaveTimer: ReturnType<typeof setTimeout> | undefined

watch(isFinished, (finished) => {
  if (!finished) return
  showLogo.value = false
  isLeaving.value = true
  emit('ready')
  leaveTimer = setTimeout(() => emit('done'), LEAVE_MS)
})

// Without a prior tap this makes no sound, except in the installed app.
onMounted(() => {
  showLogo.value = true
  playOpen(mode.value)
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
    <SheikahLoader :show="showLogo" />

    <div class="Boot-bar" aria-hidden="true">
      <div class="Boot-bar-fill" :style="{ '--progress': progress }"></div>
    </div>

    <ScanlineOverlay class="Boot-scanlines" />
  </div>
</template>

<style lang="scss" scoped>
// Covers the screen of the slate, inside the frame, like the loader of the other transitions.
.Boot {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  background: var(--color-base);

  &--leaving {
    pointer-events: none;
    animation: boot-out 1.2s ease-in both;
  }

  // Segments, like the tiles of an old display. Under the logo, above the lower strip of the frame.
  &-bar {
    position: absolute;
    z-index: 6;
    left: 50%;
    bottom: calc(var(--frame-bottom) + 1.5rem);
    width: min(60vmin, 320px);
    height: 14px;
    padding: 2px;
    transform: translateX(-50%);
    border: 1px solid color-mix(in srgb, var(--color-primary) 55%, transparent);
    animation: fade-in 0.6s 1s ease-out both;

    &-fill {
      height: 100%;
      width: calc(var(--progress) * 100%);
      background: repeating-linear-gradient(90deg, var(--color-primary) 0 6px, transparent 6px 9px);
      box-shadow: 0 0 10px var(--color-primary);
    }
  }

  &-scanlines {
    z-index: 7;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
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
  .Boot-bar {
    animation: none;
  }

  .Boot--leaving {
    animation-duration: 0.4s;
  }
}
</style>
