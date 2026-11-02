import markerIconHome from '@/assets/images/map/home.png'
import markerIconPalace from '@/assets/images/map/palace.png'
import markerIconCastle from '@/assets/images/map/castle.png'
import markerIconGate from '@/assets/images/map/gate.png'
import markerIconFountain from '@/assets/images/map/fountain.png'
import markerIconStable from '@/assets/images/map/stable.png'
import markerIconGerudo from '@/assets/images/map/gerudo.png'
import markerIconGoron from '@/assets/images/map/goron.png'
import markerIconZora from '@/assets/images/map/zora.png'
import markerIconKurhotel from '@/assets/images/map/kurhotel.png'
import type { LatLng } from '@/lib/geo'

// Everything that is placed on the map lives in this file, the map itself (MapApp.vue) only draws it.
// There are three kinds of markers, `minZoom` / `maxZoom` are optional on all of them (the marker fades in and out
// around those zoom levels; the map goes from zoom 11 to street level, the city is about 15-17):
//  - `pois`: a point with an icon. `level` 1 (default) is a main place, shown from zoom `poiLevels[1].minZoom`; level 2
//    is a small one, shown later (`poiLevels[2].minZoom`) and drawn smaller. A POI's own `minZoom` / `maxZoom` win.
//  - `areas`: a larger but specific place. The dotted outline is drawn with the real `radiusMeters` and grows with the
//    zoom; its ring icon and title fade out above `labelMaxZoom` (default `areaLabelMaxZoom`), the outline stays.
//  - `regions`: big labels for whole regions (fantasy names), olive gold with a glow like the labels of the game map.
//    `name` is the text, `caption` below it is set in the Sheikah runes (the font turns normal letters into runes, so
//    write it like a normal word), `scale` makes a label bigger or smaller.
export interface Visibility {
  minZoom?: number
  maxZoom?: number
}

/** Zoom at which a level shows up and its size relative to the full size (level 1). */
export const poiLevels = {
  1: { minZoom: 12.5, scale: 1 },
  2: { minZoom: 14.5, scale: 0.7 }
}

/** Above this zoom an area's ring icon and title are hidden, the outline is big enough by then. */
export const areaLabelMaxZoom = 17

export interface Poi extends Visibility {
  title: string
  position: LatLng
  icon: string
  /** 1 (default): main place. 2: small place, shown later and smaller. */
  level?: keyof typeof poiLevels
}

export interface Area extends Visibility {
  title: string
  position: LatLng
  radiusMeters: number
  /** Optional small icon in the center of the ring. */
  icon?: string
  /** Zoom above which the ring icon, the icon and the title are hidden. Default: `areaLabelMaxZoom`. */
  labelMaxZoom?: number
}

export interface Region extends Visibility {
  name: string
  caption?: string
  position: LatLng
  /** Size of the label relative to the default (1): bigger for the big regions. */
  scale?: number
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
    icon: markerIconGate,
    level: 2
  },
  {
    title: 'Stuttgarter Torhaus',
    position: {
      lat: 48.888887,
      lng: 9.193957
    },
    icon: markerIconGate,
    level: 2
  },
  {
    title: 'Schorndorfer Torhaus',
    position: {
      lat: 48.895806,
      lng: 9.203389
    },
    icon: markerIconGate,
    level: 2
  },
  {
    title: 'Pflugfelder Torhaus',
    position: {
      lat: 48.89083,
      lng: 9.183373
    },
    icon: markerIconGate,
    level: 2
  },
  {
    title: 'Aldinger Torhaus',
    position: {
      lat: 48.886904,
      lng: 9.203264
    },
    icon: markerIconGate,
    level: 2
  },
  {
    title: 'Asperger Torhaus',
    position: {
      lat: 48.897503,
      lng: 9.182989
    },
    icon: markerIconGate,
    level: 2
  },
  {
    title: 'Marbacher Torhaus',
    position: {
      lat: 48.90254995369686,
      lng: 9.20048606997646
    },
    icon: markerIconGate,
    level: 2
  },
  {
    title: 'Feenquelle',
    position: {
      lat: 48.910015,
      lng: 9.214296
    },
    icon: markerIconFountain,
    level: 2
  },
  {
    title: 'Quelle der Macht',
    position: {
      lat: 48.9001518187164,
      lng: 9.195957220987154
    },
    icon: markerIconFountain,
    level: 2
  },
  {
    title: 'Quelle des Ursprungs',
    position: {
      lat: 48.89743145785699,
      lng: 9.191552095298437
    },
    icon: markerIconFountain,
    level: 2
  },
  {
    title: 'Quelle der Träume',
    position: {
      lat: 48.8930817,
      lng: 9.1928228
    },
    icon: markerIconFountain,
    level: 2
  },
  {
    title: 'Quelle des Waldes',
    position: {
      lat: 48.907568,
      lng: 9.1947786
    },
    icon: markerIconFountain,
    level: 2
  },
  {
    title: 'Quelle der Weisheit',
    position: {
      lat: 48.91474712899295,
      lng: 9.211257210034384
    },
    icon: markerIconFountain,
    level: 2
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
    icon: markerIconGerudo
  },
  {
    title: 'Steinbruch der Goronen',
    position: {
      lat: 48.907582,
      lng: 9.2161755
    },
    icon: markerIconGoron
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
    icon: markerIconZora
  },
  {
    title: 'Kurhotel',
    position: {
      lat: 48.90973260393466,
      lng: 9.214576968240936
    },
    icon: markerIconKurhotel
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
    icon: markerIconStable,
    level: 2
  },
  {
    title: 'Bahnhof Favoritepark',
    position: {
      lat: 48.9056801,
      lng: 9.187429
    },
    icon: markerIconStable,
    level: 2
  },
  {
    title: 'Bahnhof Osterholz',
    position: {
      lat: 48.8976333338004,
      lng: 9.163368967922386
    },
    icon: markerIconStable,
    level: 2
  }
]

// SAMPLES: placeholder names, positions and radii, to be replaced with the real hunt areas.
export const areas: Area[] = [
  {
    title: 'Blühendes Barock',
    position: { lat: 48.9015, lng: 9.187 },
    radiusMeters: 250,
    minZoom: 13,
    maxZoom: 18
  },
  {
    title: 'Favoritepark',
    position: { lat: 48.9045, lng: 9.196 },
    radiusMeters: 450,
    minZoom: 13,
    maxZoom: 18
  },
  {
    title: 'Seeschloss Monrepos',
    position: { lat: 48.9106, lng: 9.1772 },
    radiusMeters: 350,
    icon: markerIconCastle,
    minZoom: 13,
    maxZoom: 18
  }
]

// SAMPLES: fantasy names for the regions of the hunt. They fade out when zooming in towards street level.
export const regions: Region[] = [
  {
    name: 'Hyrule-Ebene',
    caption: 'Ludwigsburg',
    position: { lat: 48.8905, lng: 9.1925 },
    scale: 1.25,
    maxZoom: 15
  },
  {
    name: 'Wald von Favorite',
    caption: 'Favoritepark',
    position: { lat: 48.9085, lng: 9.1965 },
    maxZoom: 15
  },
  {
    name: 'Zora-Tal',
    caption: 'Neckar',
    position: { lat: 48.9, lng: 9.2275 },
    maxZoom: 15
  }
]
