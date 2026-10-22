<script setup lang="ts">
import MediaList from '@/components/MediaList.vue'
import type { MediaImage } from '@/types/media'

// One entry per public/media/picture-NNN.jpg, in order. Real facts: Residenzschloss, Favorite, Monrepos, Hoheneck, Torhäuser.
const pictures: Array<Pick<MediaImage, 'title' | 'description'>> = [
  {
    title: 'Verfluchter Hain',
    description:
      'Zwischen den Steinen liegt noch ein rotes Glimmen. Auch die Burg Hoheneck stand einst stolz über dem Neckar, heute überwachsen die Weinbergmauern ihre Ruinen.'
  },
  {
    title: 'See der Ruhe',
    description:
      'Das Wasser ist still, die Sonne sinkt. „Monrepos“ heißt „meine Ruhe“, und am See baute Herzog Carl Eugen zwischen 1758 und 1764 sein Schloss.'
  },
  {
    title: 'Steinwache',
    description:
      'Ein Wächterstein wacht über der Ebene. Wo einst die Stadtmauer fiel, bewachen noch die Torhäuser die Einfahrten nach Ludwigsburg.'
  },
  {
    title: 'Oase der Gerudo',
    description:
      'Hitze flimmert über dem Wasser. Auf der Karte der Tafel liegt dieser Ort mitten in Ludwigsburg, aber kein Reisender hat ihn je gefunden.'
  },
  {
    title: 'Vergessene Wälder',
    description:
      'Wer sich hier verirrt, kehrt nicht zurück, so heißt es. Die Bäume stehen enger, als sie sollten, und der Nebel hat keine Quelle.'
  },
  {
    title: 'Sporn über dem Fluss',
    description:
      'Ein Felssporn über dem Tal, von dem aus man alles sieht. Die Burg Hoheneck sitzt auf einem solchen Sporn, gebaut um das Jahr 1200.'
  },
  {
    title: 'Das ferne Schloss',
    description:
      'Am Horizont ragt das Schloss auf. Das Residenzschloss wurde ab 1704 erbaut, mit über 450 Zimmern in 18 Gebäuden, und heißt das „Schwäbische Versailles“.'
  },
  {
    title: 'Verderbte Ruine',
    description:
      'Etwas Altes ist hier erwacht. Die Mauern sind warm, obwohl der Wind kalt über sie streicht. Berühre nichts, bevor die Tafel es erlaubt.'
  },
  {
    title: 'Allee der Zwillingsbäume',
    description:
      'Zwei uralte Bäume rahmen den Weg. Eine Allee verbindet das Residenzschloss mit Schloss Favorite, erbaut zwischen 1717 und 1723.'
  },
  {
    title: 'Das Tor im Moos',
    description:
      'Das Tor steht noch, die Mauern daneben nicht mehr. Niemand weiß, welche Stadt es einst schützte und wer den Schlüssel trägt.'
  },
  {
    title: 'Im Tiergarten',
    description:
      'Hier jagten die Herzöge. Das Gelände um Schloss Favorite war ein Tiergarten und ist heute der Favoritepark, in dem man leicht vom Weg abkommt.'
  },
  {
    title: 'Deku-Wurzel',
    description:
      'Ein alter Stumpf im hohen Gras. Wer ihm zuhört, hört fast Worte. Die Feen, sagt man, ziehen im Frühjahr von Quelle zu Quelle.'
  }
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
