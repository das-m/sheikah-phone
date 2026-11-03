<script setup lang="ts">
defineProps<{
  /** The rounded distance to show, e.g. "ca. 450 m" (see `formatApproxDistance`). */
  text: string
}>()
</script>

<template>
  <div class="DistanceWidget">
    <div class="DistanceWidget-value">{{ text }}</div>
    <div class="DistanceWidget-label" aria-hidden="true">Entfernung</div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/widget';

// Looks like the clock: the screen sets `--widget-clock-size`, `--widget-clock-weight` and `--widget-align`.
.DistanceWidget {
  display: flex;
  flex-direction: column;
  align-items: var(--widget-align, center);
  color: var(--color-primary);
  text-shadow: 0 0 10px var(--color-primary);

  &-value {
    font-size: var(--widget-clock-size, 2.5em);
    font-weight: var(--widget-clock-weight, 400);
    line-height: 1.2;
    white-space: nowrap;
  }

  &-label {
    @include widget.label;
  }
}
</style>
