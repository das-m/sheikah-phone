import markerIconHome from '@/assets/images/map/home.png'
import markerIconPalace from '@/assets/images/map/palace.png'
import markerIconCastle from '@/assets/images/map/castle.png'
import markerIconGate from '@/assets/images/map/gate.png'
import markerIconFountain from '@/assets/images/map/fountain.png'
import markerIconStable from '@/assets/images/map/stable.png'
import markerIconSnake from '@/assets/images/map/snake.png'
import markerIconWell from '@/assets/images/map/well.png'
import markerIconFrog from '@/assets/images/map/frog.png'
import markerIconBottle from '@/assets/images/map/bargainer.png'
import type { LatLng } from '@/lib/geo'

export interface Poi {
  title: string
  position: LatLng
  icon: string
}

// Torhaus positions: OpenStreetMap, matching de.wikipedia "Ludwigsburger Torhäuser".
// Marbacher Torhaus no longer exists (removed 1950 for Marbacher Straße); its position is approximate.
export const pois: Poi[] = [
  {
    title: 'Ludwigsburg',
    position: {
      lat: 48.897551,
      lng: 9.191567
    },
    icon: markerIconHome
  },
  {
    title: 'Palast',
    position: {
      lat: 48.899614,
      lng: 9.195613
    },
    icon: markerIconPalace
  },
  {
    title: 'Schloß Favorite',
    position: {
      lat: 48.904458,
      lng: 9.196029
    },
    icon: markerIconCastle
  },
  {
    title: 'Schloß Monrepos',
    position: {
      lat: 48.9106168,
      lng: 9.177179
    },
    icon: markerIconCastle
  },
  {
    title: 'Burg Hohenegge',
    position: {
      lat: 48.9147811,
      lng: 9.2062516
    },
    icon: markerIconCastle
  },
  {
    title: 'Turm des Waldes',
    position: {
      lat: 48.88450369407149,
      lng: 9.196850687540637
    },
    icon: markerIconCastle
  },
  {
    title: 'Heilbronner Torhaus',
    position: {
      lat: 48.902293,
      lng: 9.193812
    },
    icon: markerIconGate
  },
  {
    title: 'Stuttgarter Torhaus',
    position: {
      lat: 48.888887,
      lng: 9.193957
    },
    icon: markerIconGate
  },
  {
    title: 'Schorndorfer Torhaus',
    position: {
      lat: 48.895806,
      lng: 9.203389
    },
    icon: markerIconGate
  },
  {
    title: 'Pflugfelder Torhaus',
    position: {
      lat: 48.89083,
      lng: 9.183373
    },
    icon: markerIconGate
  },
  {
    title: 'Aldinger Torhaus',
    position: {
      lat: 48.886904,
      lng: 9.203264
    },
    icon: markerIconGate
  },
  {
    title: 'Asperger Torhaus',
    position: {
      lat: 48.897503,
      lng: 9.182989
    },
    icon: markerIconGate
  },
  {
    title: 'Marbacher Torhaus',
    position: {
      lat: 48.90254995369686,
      lng: 9.20048606997646
    },
    icon: markerIconGate
  },
  {
    title: 'Feenquelle',
    position: {
      lat: 48.910015,
      lng: 9.214296
    },
    icon: markerIconFountain
  },
  {
    title: 'Quelle der Macht',
    position: {
      lat: 48.9001518187164,
      lng: 9.195957220987154
    },
    icon: markerIconFountain
  },
  {
    title: 'Quelle des Ursprungs',
    position: {
      lat: 48.89743145785699,
      lng: 9.191552095298437
    },
    icon: markerIconFountain
  },
  {
    title: 'Quelle der Träume',
    position: {
      lat: 48.8930817,
      lng: 9.1928228
    },
    icon: markerIconFountain
  },
  {
    title: 'Quelle des Waldes',
    position: {
      lat: 48.907568,
      lng: 9.1947786
    },
    icon: markerIconFountain
  },
  {
    title: 'Quelle der Weisheit',
    position: {
      lat: 48.91474712899295,
      lng: 9.211257210034384
    },
    icon: markerIconFountain
  },
  {
    title: 'Stall der Prinzessin',
    position: {
      lat: 48.9021607,
      lng: 9.1838877
    },
    icon: markerIconStable
  },
  {
    title: 'Gerudo Stätte',
    position: {
      lat: 48.9070897,
      lng: 9.1977192
    },
    icon: markerIconSnake
  },
  {
    title: 'Steinbruch der Goronen',
    position: {
      lat: 48.907582,
      lng: 9.2161755
    },
    icon: markerIconWell
  },
  {
    title: 'Kakariko',
    position: {
      lat: 48.91361403351804,
      lng: 9.211315271724766
    },
    icon: markerIconHome
  },
  {
    title: 'Reich der Zora',
    position: {
      lat: 48.910297,
      lng: 9.2122332
    },
    icon: markerIconFrog
  },
  {
    title: 'Kurhotel',
    position: {
      lat: 48.90973260393466,
      lng: 9.214576968240936
    },
    icon: markerIconBottle
  },
  {
    title: 'Vergessene Wälder',
    position: {
      lat: 48.89686900463565,
      lng: 9.163170767901905
    },
    icon: markerIconStable
  },
  {
    title: 'Bahnhof Ludwigsburg',
    position: {
      lat: 48.892308609476544,
      lng: 9.185691454480875
    },
    icon: markerIconStable
  },
  {
    title: 'Bahnhof Favoritepark',
    position: {
      lat: 48.9056801,
      lng: 9.187429
    },
    icon: markerIconStable
  },
  {
    title: 'Bahnhof Osterholz',
    position: {
      lat: 48.8976333338004,
      lng: 9.163368967922386
    },
    icon: markerIconStable
  }
]
