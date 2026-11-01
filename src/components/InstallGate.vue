<script setup lang="ts">
import { computed } from 'vue'

import InfoText from '@/components/InfoText.vue'
import { useInstall } from '@/composables/useInstall'

const { canInstall, isInstalled, wasDeclined, shouldShowGate, install, dismiss } = useInstall()

const message = computed(() => {
  if (isInstalled.value)
    return 'Die Tafel ist installiert. Schließe den Browser und öffne sie vom Startbildschirm.'
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
      <button class="InstallGate-skip" v-if="!isInstalled" @click="dismiss">Später</button>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/button';
@use '@/assets/scss/surface';

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
  @include surface.surface;

  &-button {
    padding: 1.2em 3em;
    font-size: 1.2em;
    @include button.framed;
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
