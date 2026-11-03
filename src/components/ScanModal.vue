<script setup lang="ts">
import { computed } from 'vue'

import OrnamentTitle from '@/components/OrnamentTitle.vue'
import type { ScanModalContent } from '@/composables/useScanAction'

const props = defineProps<{ content: ScanModalContent | null }>()
const emit = defineEmits<{ close: []; select: [] }>()

// "Common locations" may list several places, one per line.
const locations = computed(() => props.content?.locations?.split('\n').filter(Boolean) ?? [])
</script>

<template>
  <Transition name="modal">
    <div class="ScanModal" v-if="content" @click.self="emit('close')">
      <div class="ScanModal-panel" role="dialog" aria-modal="true" :aria-label="content.title">
        <!-- The entry, like the compendium: title and picture left, the texts right. -->
        <div class="ScanModal-visual">
          <h2 class="ScanModal-title">
            <span class="ScanModal-number" v-if="content.number">{{ content.number }}</span>
            {{ content.title }}
          </h2>
          <div class="ScanModal-picture">
            <img v-if="content.image" class="ScanModal-image" :src="content.image" alt="" />
            <div v-else class="ScanModal-placeholder"></div>
          </div>
        </div>

        <div class="ScanModal-info">
          <OrnamentTitle label="Beschreibung" />
          <p class="ScanModal-text">{{ content.text }}</p>

          <template v-if="locations.length">
            <OrnamentTitle label="Fundorte" />
            <p class="ScanModal-location" v-for="place in locations" :key="place">{{ place }}</p>
          </template>

          <p class="ScanModal-status" v-if="content.statusText">{{ content.statusText }}</p>

          <div class="ScanModal-buttons">
            <button
              type="button"
              class="ScanModal-button"
              v-if="content.selectable"
              @click="emit('select')"
            >
              Als Sensor Ziel wählen
            </button>
            <button type="button" class="ScanModal-button" @click="emit('close')">Abbrechen</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/button';

.ScanModal {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  // The right side keeps clear of the corner art of the frame (it reaches in beside the panel).
  padding: calc(var(--frame-top) + 1rem) calc(var(--frame-corner-br) + 1.5rem)
    calc(var(--frame-bottom) + 1rem) 2rem;
  background: rgba(4, 6, 16, 0.88);

  // Two columns in landscape (picture | texts), one in a narrow window.
  &-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.7fr);
    gap: 2rem;
    align-items: start;
    width: min(100%, 60rem);
    max-height: 100%;
    overflow-y: auto;
    color: var(--color-primary);
    font-family: Roboto, sans-serif;
    font-style: italic;
    text-shadow: 0 0 8px color-mix(in srgb, var(--color-primary) 60%, transparent);
  }

  &-visual {
    min-width: 0;
  }

  &-title {
    margin: 0 0 0.5em;
    font-size: 1.2em;
    font-weight: 500;
    line-height: 1.2;
    text-align: center;
    text-shadow: 0 0 8px var(--color-primary);
  }

  &-number {
    opacity: 0.8;
  }

  // The picture sits in a thin, bright frame. It is a square, but never taller than the free height.
  &-picture {
    width: min(100%, calc(100vh - var(--frame-top) - var(--frame-bottom) - 7rem));
    aspect-ratio: 1;
    margin: 0 auto;
    padding: 0.5rem;
    box-sizing: border-box;
    border: 2px solid color-mix(in srgb, var(--color-primary) 55%, transparent);
    box-shadow:
      0 0 12px color-mix(in srgb, var(--color-primary) 45%, transparent),
      inset 0 0 12px color-mix(in srgb, var(--color-primary) 30%, transparent);
  }

  &-image,
  &-placeholder {
    display: block;
    width: 100%;
    height: 100%;
  }

  &-image {
    object-fit: cover;
  }

  // No picture yet: the dim Sheikah eye on a dark ground.
  &-placeholder {
    background:
      url(@/assets/images/logo/sheikah-main.svg) center / 55% no-repeat,
      rgba(0, 0, 0, 0.4);
    opacity: 0.35;
  }

  &-text,
  &-location {
    margin: 0 0 1em;
    padding: 0 0.3em;
    line-height: 1.3;
  }

  &-text,
  &-location {
    font-size: 0.75em;
    font-weight: 300;
  }

  &-location {
    margin-bottom: 0.3em;
  }

  &-status {
    margin: 1em 0 0;
    color: var(--color-red);
    text-shadow: none;
  }

  &-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1.5em;
  }

  &-button {
    padding: 0.6em 2em;
    font-size: 0.75em;
    font-style: normal;
    @include button.framed;
  }
}

// Its own short fade: the global `fade` waits for the loader (`--screen-delay`), which would leave the modal invisible
// for seconds after the hold completes.
.modal-enter-active {
  transition: opacity 0.25s ease;
}

.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
