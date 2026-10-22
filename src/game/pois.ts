import markerIconHome from '@/assets/images/map/home.png'
import markerIconPalace from '@/assets/images/map/palace.png'
import markerIconCastle from '@/assets/images/map/castle.png'
import markerIconGate from '@/assets/images/map/gate.png'
import markerIconFountain from '@/assets/images/map/fountain.png'
import markerIconStable from '@/assets/images/map/stable.png'
import type { LatLng } from '@/lib/geo'

export interface Poi {
  title: string
  position: LatLng
  icon: string
}

// TODO(verify): Schorndorfer and Aldinger Torhaus share identical coordinates, so one of them is a placeholder.
// TODO(verify): Zugstation Ludwigsburg and Bahnhof Ludwigsburg are the same point (duplicate marker).
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
      lat: 48.9022941,
      lng: 9.1912123
    },
    icon: markerIconGate
  },
  {
    title: 'Stuttgarter Torhaus',
    position: {
      lat: 48.888894,
      lng: 9.189103
    },
    icon: markerIconGate
  },
  {
    title: 'Schorndorfer Torhaus',
    position: {
      lat: 48.8945931,
      lng: 9.1740354
    },
    icon: markerIconGate
  },
  {
    title: 'Pflugfelder Torhaus',
    position: {
      lat: 48.8904332,
      lng: 9.1837984
    },
    icon: markerIconGate
  },
  {
    title: 'Aldinger Torhaus',
    position: {
      lat: 48.8945931,
      lng: 9.1740354
    },
    icon: markerIconGate
  },
  {
    title: 'Asperger Torhaus',
    position: {
      lat: 48.8945931,
      lng: 9.1781185
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
    icon: markerIconHome
  },
  {
    title: 'Steinbruch der Goronen',
    position: {
      lat: 48.907582,
      lng: 9.2161755
    },
    icon: markerIconHome
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
    icon: markerIconHome
  },
  {
    title: 'Kurhotel',
    position: {
      lat: 48.90973260393466,
      lng: 9.214576968240936
    },
    icon: markerIconHome
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
    title: 'Zugstation Ludwigsburg',
    position: {
      lat: 48.892308609476544,
      lng: 9.185691454480875
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
