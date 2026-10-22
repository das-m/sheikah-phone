<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  url: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: false },
  icon: { type: String, required: false }
})
const test = false
const ThumbnailIconClass = computed(() => {
  return 'MediaItem-thumbnail-icon--' + props.icon
})
</script>

<template>
  <div class="MediaItem">
    <div class="MediaItem-thumbnail">
      <img :src="props.url" :alt="props.title" class="MediaItem-thumbnail-image" />
      <div class="MediaItem-thumbnail-icon" :class="ThumbnailIconClass" v-if="props.icon"></div>
    </div>
    <div class="MediaItem-detail" v-show="test">
      <img :src="props.url" :alt="props.title" class="MediaItem-picture" />
      <span class="MediaItem-index">{{ props.id }}</span>
      <span class="MediaItem-title">{{ props.title }}</span>
      <span class="MediaItem-description">{{ props.description }}</span>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.MediaItem
    width calc(50% - 1em)

    &-thumbnail
        aspect-ratio 1/1
        margin 0 auto
        position relative

        &-image
            width 100%
            height 100%

    &-detail
        position fixed
        line-height 1
        margin 0
        display block
        position relative
        z-index 10
        width 100%
        height 100%
        object-fit cover
        border solid 2px var(--color-contrast)
        box-shadow 0 0 10px var(--color-primary)

        &:before
            content " "
            position absolute
            z-index 30
            top 0
            left 0
            display block
            height 100%
            width 100%
            background rgba(1,7,16,0.3) url(@/assets/images/overlay/scanlines.svg) center repeat
            background-size 200% auto


        &:after
            content " "
            position absolute
            z-index 0
            top 0
            left 0
            opacity 0.3
            display block
            height 100%
            width 100%
            background rgba(0,0,0,1) url(@/assets/images/ui/list-item-placeholder.svg) center no-repeat
            background-size 30%

    &-index
        position absolute
        z-index 100
        top 5px
        right 10px
        color var(--color-primary-hover)
        opacity 0.8
        font-weight 600
        font-size 0.9em
        text-shadow 0 0 0.4em var(--color-primary)
        letter-spacing 1px

    &-title
        font-family "Sheikah"
        color var(--color-primary)
        font-size 1.5em
        letter-spacing 1px
        display block

    &-description
        font-size 0.75em
        color var(--color-primary-hover)
</style>
