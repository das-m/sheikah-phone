<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import SheikahLoader from './components/SheikahLoader.vue'

// init audio
import sound_open from './assets/audio/open.wav'
import sound_close from './assets/audio/close.wav'
const audio_open = new Audio(sound_open)
const audio_close = new Audio(sound_close)

// init loader
const showLoader = ref(false)
const route = useRoute()

const isBackButtonActive = ref(false)

// do a `console.log(route)` to see route attributes (fullPath, hash, params, path...)
watch(
  () => route.fullPath,
  async () => {
    show()

    if (route.name == 'home') {
      audio_close.play()
      isBackButtonActive.value = false
    } else {
      audio_open.play()
      isBackButtonActive.value = true
    }
  }
)

function show() {
  showLoader.value = true
  setTimeout(() => {
    showLoader.value = false
  }, 1200)
}

show()
audio_open.play()
</script>

<template>
  <div class="Phone">
    <header class="Phone-header">
      <div class="Phone-header-left">
        <router-link class="Phone-header-left-back" to="/" v-if="isBackButtonActive"></router-link>
      </div>
      <div class="Phone-header-right"></div>
    </header>

    <main class="Phone-main" id="main">
      <SheikahLoader :show="showLoader" />
      <RouterView />
    </main>

    <footer class="Phone-footer">
      <div class="Phone-footer-left"></div>
      <div class="Phone-footer-right"></div>
    </footer>
  </div>
</template>

<style lang="stylus" scoped>

.Phone
    position relative
    width inherit
    height inherit
    background url(@/assets/images/background/background.png)

    &-main
        position absolute
        z-index 1
        top 0
        right 0
        bottom 0
        left 0

    &-footer
    &-header
        position fixed
        z-index 100
        left 0
        right 0
        display flex
        align-items stretch
        justify-content flex-start
        background transparent no-repeat
        background-size 100% 100%
        pointer-events none

        &-left
        &-right
            aspect-ratio 1/1
            position absolute
            z-index 10
            width 40vw
            max-width 200px
            background transparent no-repeat
            background-size 100% 100%
            flex-shrink 0

    &-header
        top 0
        height 50px
        background-image url(@/assets/images/background/header-center.png)
        background-size 100% 100%

        &-left
            top 0
            left 0
            background-image url(@/assets/images/background/header-left.png)

            &-back
                width 100%
                height 100%
                display block
                pointer-events all
                aspect-ratio 1/1
                background transparent url(@/assets/images/ui/header-left-back.png) no-repeat
                background-size 100% 100%

        &-right
            top 0
            right 0
            background-image url(@/assets/images/background/header-right.png)

    &-footer
        bottom 0
        height 50px
        background-image url(@/assets/images/background/footer-center.png)
        background-size 100% 100%

        &-left
        &-right
            width 20vw
            max-width 100px

        &-left
            bottom 0
            left 0
            background-image url(@/assets/images/background/footer-left.png)

        &-right
            bottom 0
            right 0
            background-image url(@/assets/images/background/footer-right.png)
</style>
