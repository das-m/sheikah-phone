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
.ScanModal {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--frame-top) + 1rem) 2rem calc(var(--frame-bottom) + 1rem);
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
    font-family: OpenSans, sans-serif;
    font-style: italic;
    text-shadow: 0 0 8px color-mix(in srgb, var(--color-primary) 60%, transparent);

    @media (max-aspect-ratio: 1/1) {
      grid-template-columns: 1fr;
    }
  }

  &-visual {
    min-width: 0;
  }

  &-title {
    margin: 0 0 0.5em;
    font-size: 1.4em;
    font-weight: 600;
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
    font-size: 1.15em;
    line-height: 1.3;
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
    flex-direction: column;
    gap: 0.8rem;
    max-width: 22rem;
    margin-top: 1.5em;
  }

  // A flat stone-grey plate with a thin edge; pressed or focused it turns near-black with a glowing cream edge and
  // cut corners. The shape is two stacked layers (edge, then fill 2 px smaller), so the glow (a drop-shadow on the
  // button) follows the cut corners; `clip-path` on the button itself would cut the glow off.
  &-button {
    --cut: 0.6rem;
    --edge: 2px;

    position: relative;
    isolation: isolate;
    padding: 0.7em 1.5em;
    border: 0;
    background: none;
    color: var(--color-contrast);
    font-family: OpenSans, sans-serif;
    font-style: italic;
    font-weight: 600;
    font-size: 1.15em;
    text-shadow: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: filter 0.15s;

    &::before,
    &::after {
      content: '';
      position: absolute;
      z-index: -1;
      border-radius: 0.3rem;
    }

    &::before {
      inset: 0;
      background: rgba(226, 222, 211, 0.22);
    }

    &::after {
      inset: 1px;
      background: #2a2a26;
    }

    &:hover,
    &:active,
    &:focus-visible {
      outline: none;
      filter: drop-shadow(0 0 0.35rem rgba(240, 232, 200, 0.7));

      &::before,
      &::after {
        border-radius: 0;
      }

      &::before {
        background: #efe8cc;
        clip-path: polygon(
          var(--cut) 0,
          calc(100% - var(--cut)) 0,
          100% var(--cut),
          100% calc(100% - var(--cut)),
          calc(100% - var(--cut)) 100%,
          var(--cut) 100%,
          0 calc(100% - var(--cut)),
          0 var(--cut)
        );
      }

      &::after {
        inset: var(--edge);
        background: #0f0f0b;
        clip-path: polygon(
          calc(var(--cut) - var(--edge) * 0.4) 0,
          calc(100% - var(--cut) + var(--edge) * 0.4) 0,
          100% calc(var(--cut) - var(--edge) * 0.4),
          100% calc(100% - var(--cut) + var(--edge) * 0.4),
          calc(100% - var(--cut) + var(--edge) * 0.4) 100%,
          calc(var(--cut) - var(--edge) * 0.4) 100%,
          0 calc(100% - var(--cut) + var(--edge) * 0.4),
          0 calc(var(--cut) - var(--edge) * 0.4)
        );
      }
    }
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
