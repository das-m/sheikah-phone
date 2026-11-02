<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <h3 class="OrnamentTitle">
    <span class="OrnamentTitle-end OrnamentTitle-end--left"></span>
    <span class="OrnamentTitle-line"></span>
    <span class="OrnamentTitle-label">{{ label }}</span>
    <span class="OrnamentTitle-line"></span>
    <span class="OrnamentTitle-end OrnamentTitle-end--right"></span>
  </h3>
</template>

<style lang="scss" scoped>
// A section heading: the label in the middle of a line with the Sheikah ornament at both ends (the compendium look).
.OrnamentTitle {
  display: flex;
  align-items: center;
  gap: 0.6em;
  margin: 0 0 0.5em;
  font-family: Roboto, sans-serif;
  font-style: italic;
  font-weight: 500;
  font-size: 1em;
  color: var(--color-primary);
  text-shadow: 0 0 6px var(--color-primary);

  &-label {
    white-space: nowrap;
  }

  &-line {
    flex: 1;
    height: 0.1em;
    min-width: 1em;
    background: var(--color-primary);
    box-shadow: 0 0 5px var(--color-primary);
  }

  &-end {
    flex: none;
    width: 1.8em;
    height: 1.2em;
    background: center / contain no-repeat;

    &--left {
      background-image: url(@/assets/images/ui/title-ornament-left.svg);
    }

    &--right {
      background-image: url(@/assets/images/ui/title-ornament-right.svg);
    }
  }
}
</style>
