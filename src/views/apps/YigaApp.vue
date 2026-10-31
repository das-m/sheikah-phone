<script setup lang="ts">
import BackButton from '@/components/BackButton.vue'
import InfoText from '@/components/InfoText.vue'
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <BackButton />
      <InfoText title="Yiga" message="Hier entsteht etwas …" />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.App {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
