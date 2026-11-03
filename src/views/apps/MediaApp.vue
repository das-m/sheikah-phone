<script setup lang="ts">
import BackButton from '@/components/BackButton.vue'
import MediaList from '@/components/MediaList.vue'
import type { MediaImage } from '@/types/media'

// One entry per public/media/picture-NNN.jpg, in order. The descriptions are placeholder file names for now (like a
// camera's), fixed so they stay the same on every start.
const descriptions = [
  'DSCF0412.JPG',
  'DSCF0413.JPG',
  'DSCF0419.JPG',
  'DSCF0427.JPG',
  'DSCF0431.JPG',
  'DSCF0438.JPG',
  'DSCF0442.JPG',
  'DSCF0450.JPG',
  'DSCF0455.JPG',
  'DSCF0461.JPG',
  'DSCF0468.JPG',
  'DSCF0473.JPG'
]

const images: MediaImage[] = descriptions.map((description, index) => {
  const url = `${import.meta.env.BASE_URL}media/picture-${String(index + 1).padStart(3, '0')}.jpg`
  return { description, largeURL: url, thumbnailURL: url, width: 1920, height: 1080 }
})
</script>

<template>
  <Transition name="fade" appear>
    <div class="App">
      <BackButton />
      <div class="App-media">
        <div class="App-media-scroller">
          <MediaList :images="images" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.App {
  width: 100%;
  height: 100%;
  position: relative;

  &-media {
    &-scroller {
      width: 100%;
      height: 100vh;
      overflow: auto;
    }
  }
}
</style>
