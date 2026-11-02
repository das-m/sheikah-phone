<script setup lang="ts">
import type { ScanModalContent } from '@/composables/useScanAction'

defineProps<{ content: ScanModalContent | null }>()
const emit = defineEmits<{ close: []; select: [] }>()
</script>

<template>
  <Transition name="fade">
    <div class="ScanModal" v-if="content" @click.self="emit('close')">
      <div class="ScanModal-panel" role="dialog" aria-modal="true" :aria-label="content.title">
        <h2 class="ScanModal-title">{{ content.title }}</h2>
        <img v-if="content.image" class="ScanModal-image" :src="content.image" alt="" />
        <p class="ScanModal-text">{{ content.text }}</p>
        <p class="ScanModal-locations" v-if="content.locations">
          <span class="ScanModal-label">Zu finden:</span> {{ content.locations }}
        </p>
        <p class="ScanModal-status" v-if="content.statusText">{{ content.statusText }}</p>
        <div class="ScanModal-buttons">
          <button
            type="button"
            class="ScanModal-button"
            v-if="content.selectable"
            @click="emit('select')"
          >
            Auswählen
          </button>
          <button type="button" class="ScanModal-button" @click="emit('close')">Zurück</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/button';
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

  &-image {
    display: block;
    max-width: 100%;
    max-height: 30vh;
    margin: 0 auto 1em;
    object-fit: contain;
  }

  &-text {
    margin: 0 0 1em;
    line-height: 1.5;
  }

  &-locations {
    margin: 0 0 1em;
    line-height: 1.5;
  }

  &-label {
    color: var(--color-primary);
  }

  &-status {
    margin: 0 0 1em;
    color: var(--color-red);
  }

  &-buttons {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1.5em;
  }

  &-button {
    padding: 0.6em 2em;
    font-size: 1em;
    @include button.framed;
  }
}
</style>
