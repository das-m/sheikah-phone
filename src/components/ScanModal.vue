<script setup lang="ts">
import type { ScanModalContent } from '@/composables/useScanAction'

defineProps<{ content: ScanModalContent | null }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Transition name="fade">
    <div class="ScanModal" v-if="content" @click.self="emit('close')">
      <div class="ScanModal-panel" role="dialog" aria-modal="true" :aria-label="content.title">
        <h2 class="ScanModal-title">{{ content.title }}</h2>
        <p class="ScanModal-text">{{ content.text }}</p>
        <button type="button" class="ScanModal-close" @click="emit('close')">Schließen</button>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/surface';

.ScanModal {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--frame-top) + 1rem) 2rem calc(var(--frame-bottom) + 1rem);
  background: rgba(0, 0, 0, 0.6);

  &-panel {
    width: min(100%, 32rem);
    max-height: 100%;
    overflow-y: auto;
    padding: 1rem 1.5rem;
    border: 20px solid transparent;
    border-image: url(@/assets/images/ui/frame.svg) 10 / 20px;
    text-align: center;
    color: var(--color-contrast);
    @include surface.surface;
  }

  &-title {
    margin: 0 0 0.8em;
    font-family: HyliaSerif, serif;
    font-weight: normal;
    font-size: 1.4em;
    letter-spacing: 0.05em;
    color: var(--color-primary);
    text-shadow: 0 0 8px var(--color-primary);
  }

  &-text {
    margin: 0 0 1.5em;
    line-height: 1.5;
  }

  &-close {
    padding: 0.6em 2em;
    border-image: url(@/assets/images/ui/frame.svg) 10 / 20px;
    background: rgba(0, 0, 0, 0.4);
    color: var(--color-primary);
    font-size: 1em;
    letter-spacing: 0.1em;
    cursor: pointer;

    &:hover {
      border-image: url(@/assets/images/ui/frame-hover.svg) 10 / 20px;
      background: rgba(0, 0, 0, 0.8);
    }
  }
}
</style>
