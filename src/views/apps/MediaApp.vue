<script setup lang="ts">
import MediaList from '@/components/MediaList.vue'
import type { MediaImage } from '@/types/media'

const pictures: Array<Pick<MediaImage, 'title' | 'description'>> = [
  { title: 'Steinturm', description: 'Lorem ipsum dolor sit amet.' },
  { title: 'Feenquelle', description: 'Lorem ipsum dolor amet.' },
  { title: 'Deku-Wurzel', description: 'Lorem ipsum sit amet.' },
  { title: 'Altes Kur-Hotel', description: 'Lorem dolor sit amet.' },
  { title: 'Steinturm', description: 'Lorem ipsum dolor sit amet.' },
  { title: 'Feenquelle', description: 'Lorem ipsum dolor amet.' },
  { title: 'Deku-Wurzel', description: 'Lorem ipsum sit amet.' },
  { title: 'Altes Kur-Hotel', description: 'Lorem dolor sit amet.' },
  { title: 'Altes Kur-Hotel', description: 'Lorem dolor sit amet.' },
  { title: 'Altes Kur-Hotel', description: 'Lorem dolor sit amet.' },
  { title: 'Altes Kur-Hotel', description: 'Lorem dolor sit amet.' },
  { title: 'Altes Kur-Hotel', description: 'Lorem dolor sit amet.' }
]

const images: MediaImage[] = pictures.map((picture, index) => {
  const url = `${import.meta.env.BASE_URL}media/picture-${String(index + 1).padStart(3, '0')}.jpg`
  return { ...picture, largeURL: url, thumbnailURL: url, width: 1920, height: 1080 }
})
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <div class="App-media">
        <div class="App-media-scroller">
          <MediaList :images="images" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="stylus" scoped>
.App
    width 100%
    height 100%
    position relative

    &-media
        &-scroller
            width 100%
            height 100vh
            overflow auto
</style>
