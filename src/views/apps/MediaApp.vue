<script setup lang="ts">
import MediaList from './../../components/MediaList.vue'

interface image {
  title?: string | null
  description?: string | null
  largeURL?: string | undefined
  thumbnailURL?: string | undefined
  width?: number | null
  height?: number | null
}

const images: Array<image> = [
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-001.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-001.jpg',
    width: 1920,
    height: 1080,
    title: 'Steinturm',
    description: 'Lorem ipsum dolor sit amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-002.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-002.jpg',
    width: 1920,
    height: 1080,
    title: 'Feenquelle',
    description: 'Lorem ipsum dolor amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-003.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-003.jpg',
    width: 1920,
    height: 1080,
    title: 'Deku-Wurzel',
    description: 'Lorem ipsum sit amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-004.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-004.jpg',
    width: 1920,
    height: 1080,
    title: 'Altes Kur-Hotel',
    description: 'Lorem dolor sit amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-005.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-005.jpg',
    width: 1920,
    height: 1080,
    title: 'Steinturm',
    description: 'Lorem ipsum dolor sit amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-006.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-006.jpg',
    width: 1920,
    height: 1080,
    title: 'Feenquelle',
    description: 'Lorem ipsum dolor amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-007.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-007.jpg',
    width: 1920,
    height: 1080,
    title: 'Deku-Wurzel',
    description: 'Lorem ipsum sit amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-008.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-008.jpg',
    width: 1920,
    height: 1080,
    title: 'Altes Kur-Hotel',
    description: 'Lorem dolor sit amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-009.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-009.jpg',
    width: 1920,
    height: 1080,
    title: 'Altes Kur-Hotel',
    description: 'Lorem dolor sit amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-010.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-010.jpg',
    width: 1920,
    height: 1080,
    title: 'Altes Kur-Hotel',
    description: 'Lorem dolor sit amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-011.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-011.jpg',
    width: 1920,
    height: 1080,
    title: 'Altes Kur-Hotel',
    description: 'Lorem dolor sit amet.'
  },
  {
    largeURL: 'https://sheikah.das-m.de/media/picture-012.jpg',
    thumbnailURL: 'https://sheikah.das-m.de/media/picture-012.jpg',
    width: 1920,
    height: 1080,
    title: 'Altes Kur-Hotel',
    description: 'Lorem dolor sit amet.'
  }
]
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
