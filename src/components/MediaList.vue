<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import 'photoswipe/style.css'
import type { MediaImage } from '@/types/media'

const props = defineProps({
  images: { type: Array<MediaImage> }
})

let lightbox: PhotoSwipeLightbox | null = null

onMounted(() => {
  if (!lightbox) {
    lightbox = new PhotoSwipeLightbox({
      gallery: '#media-list',
      children: 'a',
      arrowPrev: false,
      arrowNext: false,
      zoom: true,
      initialZoomLevel: 'fill',
      secondaryZoomLevel: 1,
      maxZoomLevel: 2,
      close: true,
      counter: false,
      pswpModule: () => import('photoswipe'),
      appendToEl: document.querySelector('#main') as HTMLElement | undefined
    })

    lightbox.on('uiRegister', () => {
      lightbox?.pswp?.ui?.registerElement({
        name: 'caption',
        order: 9,
        isButton: false,
        appendTo: 'root',
        onInit: (el, pswp) => {
          pswp.on('change', () => {
            const anchor = pswp.currSlide?.data.element
            const title = document.createElement('h2')
            title.textContent = anchor?.dataset.title ?? ''
            const description = document.createElement('p')
            description.textContent = anchor?.dataset.description ?? ''
            el.replaceChildren(title, description)
          })
        }
      })
    })

    lightbox.init()
  }
})

onUnmounted(() => {
  if (lightbox) {
    lightbox.destroy()
    lightbox = null
  }
})
</script>

<template>
  <div class="MediaList" id="media-list">
    <a
      v-for="(image, key) in props.images"
      :key="key"
      :href="image.largeURL"
      :data-pswp-width="image.width"
      :data-pswp-height="image.height"
      :data-title="image.title"
      :data-description="image.description"
      class="MediaList-item"
      target="_blank"
      rel="noreferrer"
      data-cropped="true"
    >
      <img :src="image.thumbnailURL" alt="" class="MediaList-item-thumbnail" />
    </a>
  </div>
</template>

<style lang="stylus" scoped>
.MediaList
    margin 8em 2em
    display flex
    flex-wrap wrap
    align-items flex-start
    justify-content center
    gap 2em

    &-item
        width calc(50% - 1em)
        aspect-ratio 1/1
        margin 0 auto
        position relative

        &-thumbnail
            width 100%
            height 100%
</style>
