<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BootScreen from './components/BootScreen.vue'
import InstallGate from './components/InstallGate.vue'
import PhoneFrame from './components/PhoneFrame.vue'
import SheikahLoader from './components/SheikahLoader.vue'
import { useOrientationLock } from './composables/useOrientationLock'
import { useYigaMode } from './composables/useYigaMode'
import { useYigaLoop } from './composables/useYigaLoop'
import { useYigaTrigger } from './composables/useYigaTrigger'
import { isRouteAvailable, loaderVariantFor, type LoaderVariant } from './game/apps'
import { playClose, playOpen } from './lib/uiSounds'

const { mode } = useYigaMode()

// Cold start: the boot screen plays (and preloads) first. The home screen is mounted as it dissolves.
const isBooting = ref(true)
const isBooted = ref(false)
// The frame stays dark until the boot draws it in.
const isFrameOn = ref(false)

// loader between apps
// The logo arrives in 0.75 s, the pattern flickers up between 0.9 s and 1.8 s: this keeps the finished logo,
// with its glow, on screen for a moment before it leaves.
const LOADER_MS = 2200
// The switch between the modes is longer: the "hack" of the loader (SheikahLoader) runs for about 3.6 s. The
// screen after it waits for this and the loader's exit (`--screen-delay` while `Phone-main--hacking`, below).
const HACK_MS = 3600
const showLoader = ref(false)
const hack = ref<'' | 'to-yiga' | 'to-sheikah'>('')
// The look of the loader for the app that opens or closes (the lens is purple). Only changed together with `show()`.
const loaderVariant = ref<LoaderVariant>('')
const route = useRoute()

watch(
  () => route.path,
  (_, oldPath) => {
    if (!isBooted.value) return

    // A mode switch redirects away from the other mode's app. The switch already plays its sound and the loader.
    if (!isRouteAvailable(oldPath, mode.value)) return

    hack.value = ''
    // Leaving an app plays its loader too, so the lens closes in purple as well.
    loaderVariant.value = loaderVariantFor(route.path) || loaderVariantFor(oldPath)
    show()
    if (route.name == 'home') playClose(mode.value, loaderVariant.value)
    else playOpen(mode.value, loaderVariant.value)
  }
)

let loaderTimer: ReturnType<typeof setTimeout> | undefined

function show(ms = LOADER_MS) {
  showLoader.value = true
  clearTimeout(loaderTimer)
  loaderTimer = setTimeout(() => {
    showLoader.value = false
  }, ms)
}

useOrientationLock()

// Yiga mode: flip + shake in the zone; every mode switch plays the longer "hack" transition
useYigaTrigger()
useYigaLoop()
watch(mode, (value) => {
  if (!isBooted.value) return
  hack.value = value === 'yiga' ? 'to-yiga' : 'to-sheikah'
  loaderVariant.value = ''
  show(HACK_MS)
})
</script>

<template>
  <div class="Phone">
    <PhoneFrame :on="isFrameOn" />

    <InstallGate />

    <main
      :class="['Phone-main', { 'Phone-main--booting': isBooting, 'Phone-main--hacking': hack }]"
      id="main"
    >
      <SheikahLoader :show="showLoader" :hack="hack" :variant="loaderVariant" />
      <!-- keyed by the mode: the screen is built again after a switch, so it comes up after the transition -->
      <RouterView v-if="isBooted" :key="mode" />
      <BootScreen
        v-if="isBooting"
        @frame="isFrameOn = true"
        @ready="isBooted = true"
        @done="isBooting = false"
      />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.Phone {
  position: relative;
  width: inherit;
  height: inherit;

  &-main {
    position: absolute;
    z-index: 1;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;

    // The first screen is mounted while the boot screen dissolves (1.2 s), so it has less to wait for.
    &--booting {
      --screen-delay: 1s;
    }

    // After a mode switch: the hack (3.6 s) and the exit of the loader (0.65 s) play first.
    &--hacking {
      --screen-delay: 4.25s;
    }
  }
}
</style>
