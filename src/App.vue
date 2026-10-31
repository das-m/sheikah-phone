<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import InstallGate from './components/InstallGate.vue'
import PhoneFrame from './components/PhoneFrame.vue'
import SheikahLoader from './components/SheikahLoader.vue'
import { useYigaMode } from './composables/useYigaMode'
import { useYigaTrigger } from './composables/useYigaTrigger'
import { isRouteAvailable } from './game/apps'
import { playClose, playOpen } from './lib/uiSounds'

const { mode } = useYigaMode()

// init loader
const LOADER_MS = 1200
const showLoader = ref(false)
const route = useRoute()

watch(
  () => route.path,
  (_, oldPath) => {
    // A mode switch redirects away from the other mode's app. The switch already plays its sound and the loader.
    if (!isRouteAvailable(oldPath, mode.value)) return

    show()
    if (route.name == 'home') playClose(mode.value)
    else playOpen(mode.value)
  }
)

let loaderTimer: ReturnType<typeof setTimeout> | undefined

function show() {
  showLoader.value = true
  clearTimeout(loaderTimer)
  loaderTimer = setTimeout(() => {
    showLoader.value = false
  }, LOADER_MS)
}

show()
playOpen(mode.value)

// Yiga mode: flip + shake in the zone; the loader plays on every mode switch
useYigaTrigger()
watch(mode, show)
</script>

<template>
  <div class="Phone">
    <PhoneFrame />

    <InstallGate />

    <main class="Phone-main" id="main">
      <SheikahLoader :show="showLoader" />
      <RouterView />
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
  }
}
</style>
