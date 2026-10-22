<script setup lang="ts">
const props = defineProps({
  title: { type: String, required: false },
  message: { type: String, required: false }
})
</script>

<template>
  <div class="InfoText">
    <h1 class="InfoText-title">{{ props.title }}</h1>
    <div class="InfoText-line">
      <span class="InfoText-line-left"></span>
      <span class="InfoText-line-center"></span>
      <span class="InfoText-line-right"></span>
    </div>
    <p class="InfoText-message">{{ props.message }}</p>
  </div>
</template>

<style lang="stylus" scoped>
.InfoText
    font-style italic
    width 100%
    max-width 460px
    color var(--color-primary)

    &-title
    &-message
        display block
        text-align center
        margin 0 3em

    &-title
        font-size 2em
        text-shadow 0 0 5px var(--color-primary)
        line-height 1.2

    &-message
        font-size 1.2em

    &-line
        position relative
        display flex
        width 100%
        margin-bottom 0.5em

        &-left
        &-right
            display inline-block
            height 1.3em

        &-left
        &-right
            width 2.3em
            background top no-repeat
            background-size 100% 100%

        &-left
            background-image url(@/assets/images/ui/title-ornament-left.svg)

        &-right
            background-image url(@/assets/images/ui/title-ornament-right.svg)

        &-center
            background var(--color-primary)
            height 0.13em
            margin-top 0.57em
            margin-left -5px
            margin-right -5px
            flex-grow 1
</style>
