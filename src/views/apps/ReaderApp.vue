<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
const isSupported = ref(true)
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <div class="App-sensor" v-if="isSupported">
        <div class="App-sensor-icon"></div>
        <div class="App-sensor-blob"></div>
        <div class="App-sensor-blob App-sensor-blob--second"></div>
      </div>
      <div class="App-sensor" v-else>
        <div class="App-sensor-icon App-sensor-icon--disabled"></div>
      </div>
    </div>
  </Transition>
</template>

<style lang="stylus" scoped>
.App
    width 100%
    height 100%
    position relative
    display flex
    flex-direction column
    align-items center
    justify-content center

    &-sensor
        position relative
        aspect-ratio 1/1
        width 80%
        max-width 500px

        &-icon
            position absolute
            top 0
            width 100%
            height 100%
            background transparent center no-repeat
            background-size 40%
            background-image url(@/assets/images/ui/icons/reader.svg)
            animation icon-pulse 1s ease infinite

            &--disabled
                background-image url(@/assets/images/ui/icons/reader.svg)
                background-size 50%
                animation none
                filter grayscale(100%) brightness(-100%)
                opacity 0.3

        &-blob
            position absolute
            border solid 8px #9decfd
            border-radius 50%
            width 100%
            height 100%
            transform scale(1)
            opacity 0
            animation pulse 2s linear infinite

            &--second
                animation-delay 1s

@keyframes pulse
	0%
		transform scale(0.4)
		opacity 0
	30%
		transform scale(0.8)
		opacity 0.3
	80%
		transform scale(2.1)
		opacity 0
	100%
		transform scale(2.1)
		opacity 0

@keyframes icon-pulse
	0%
		filter brightness(100%)
	30%
		filter brightness(80%)
	80%
		filter brightness(80%)
	100%
		filter brightness(100%)
</style>
