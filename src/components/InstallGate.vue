<script setup lang="ts">
import { computed } from 'vue'

import InfoText from '@/components/InfoText.vue'
import { useInstall } from '@/composables/useInstall'

const { canInstall, wasDeclined, shouldShowGate, install, dismiss } = useInstall()

const message = computed(() => {
  if (canInstall.value) return 'Installiere die Tafel, um sie immer bei dir zu tragen.'
  if (wasDeclined.value) return 'Ohne Installation fehlt der Tafel ihre Kraft.'
  return 'Öffne das Browser-Menü und wähle „App installieren“ oder „Zum Startbildschirm hinzufügen“.'
})
</script>

<template>
  <Transition name="fade">
    <div class="InstallGate" v-if="shouldShowGate">
      <InfoText title="Sheikah-Tafel" :message="message" />

      <button class="InstallGate-button" v-if="canInstall" @click="install">Installieren</button>
      <button class="InstallGate-skip" @click="dismiss">Später</button>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.InstallGate {
  position: fixed;
  z-index: 200;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2em;
  padding: 0 2em;
  background: var(--color-base) url(@/assets/images/background/background.png) repeat;

  &-button {
    padding: 1.2em 3em;
    border-image: url(@/assets/images/ui/frame.svg) 10 / 20px;
    background: rgba(0, 0, 0, 0.4);
    color: var(--color-primary);
    font-size: 1.2em;
    letter-spacing: 0.1em;
    text-shadow: 0 0 8px var(--color-primary);
    cursor: pointer;

    &:hover {
      border-image: url(@/assets/images/ui/frame-hover.svg) 10 / 20px;
      background: rgba(0, 0, 0, 0.8);
    }
  }

  &-skip {
    border: 0;
    background: none;
    color: var(--color-contrast);
    opacity: 0.6;
    font-size: 0.9em;
    cursor: pointer;
  }
}
</style>
