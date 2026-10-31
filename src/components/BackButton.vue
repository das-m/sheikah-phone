<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// Step back through the history, so a device back right after it does not land on the app just left.
// Without in-app history (reload, deep link) go to the home screen instead.
function goBack() {
  if (router.options.history.state.back) router.back()
  else router.replace({ name: 'home' })
}
</script>

<template>
  <button type="button" class="BackButton" aria-label="Zurück" @click="goBack"></button>
</template>

<style lang="scss" scoped>
// Blue arrow on the left edge, vertically centered. The hit area is larger than the art (touch target).
.BackButton {
  position: fixed;
  z-index: 50;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: max(48px, calc(120 * var(--u)));
  height: max(96px, calc(220 * var(--u)));
  padding: 0;
  border: 0;
  background: url(@/assets/images/ui/arrow-left.png) center / calc(59 * var(--u))
    calc(111 * var(--u)) no-repeat;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.6;
  }
}
</style>
