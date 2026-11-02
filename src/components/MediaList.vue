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
      // The photo covers the whole screen (the frame is drawn over its edges), panning shows the rest of it;
      // a double tap zooms to 100%.
      initialZoomLevel: 'fill',
      bgOpacity: 1,
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

<style lang="scss" scoped>
// The frame art has its line ~18px inside its edge, so the photo sits in 24px padding and keeps the 340x190 ratio.
.MediaList {
  margin: 8em 0;
  padding: 0 1px;
  gap: 1em;
  // Two columns. Cells never grow past the item width and shrink with the screen (minmax 0), so a narrow
  // landscape phone still fits both.
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 388px));
  justify-content: center;
  align-items: start;

  &-item {
    display: block;
    width: 100%;
    max-width: 388px;
    padding: 24px;
    position: relative;
    outline: none;

    &:before {
      content: ' ';
      position: absolute;
      z-index: 10;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: url(@/assets/images/ui/frame.svg) center / 100% 100% no-repeat;
      pointer-events: none;
    }

    &:hover:before,
    &:focus-visible:before {
      background-image: url(@/assets/images/ui/frame-hover.svg);
    }

    &:hover &-thumbnail,
    &:focus-visible &-thumbnail {
      filter: brightness(1.15);
    }

    &-thumbnail {
      display: block;
      width: 100%;
      aspect-ratio: 340 / 190;
      object-fit: cover;
      background: rgba(0, 0, 0, 0.4);
      transition: filter 0.2s ease;
    }
  }
}
</style>
