<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
let clockworkInterval: ReturnType<typeof setInterval>
const time = ref(new Date())

onMounted(() => {
  clockworkInterval = setInterval(() => tick(), 1000)
})

onUnmounted(() => {
  clearInterval(clockworkInterval)
})

function tick() {
  time.value = new Date()
}

const hours = computed(() => {
  let h = time.value.getHours().toString()
  if (h.length < 2) {
    h = '0' + h
  }
  return h
})

const minutes = computed(() => {
  let m = time.value.getMinutes().toString()
  if (m.length < 2) {
    m = '0' + m
  }
  return m
})

const seconds = computed(() => {
  let s = time.value.getSeconds().toString()
  if (s.length < 2) {
    s = '0' + s
  }
  return s
})
</script>

<template>
  <div class="ClockWidget">
    <div class="ClockWidget-time">
      <div class="ClockWidget-time-display">
        <div class="hours">{{ hours }}</div>
        <div class="divider">:</div>
        <div class="minutes">{{ minutes }}</div>
        <div class="divider">:</div>
        <div class="seconds">{{ seconds }}</div>
      </div>
      <!--div class="ClockWidget-time-label"></div>-->
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.ClockWidget
    position relative
    font-size 2.5em
    color var(--color-primary)
    text-shadow 0 0 10px var(--color-primary)

    &-time

        &-display
            display flex
            line-height 1.2

            div
                font-weight 500

        &-label
            background url(@/assets/images/ui/labels/sheikah-clock.svg) center no-repeat
            background-size contain
            height 0.3em
</style>
