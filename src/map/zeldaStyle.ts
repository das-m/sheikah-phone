import type { ExpressionSpecification, StyleSpecification } from 'maplibre-gl'

// OpenFreeMap serves OpenMapTiles-schema vector tiles without an API key.
// Public service without a guarantee: self-host as PMTiles before the real hunt (see CLAUDE.md).
export const TILEJSON_URL = 'https://tiles.openfreemap.org/planet'

const colors = {
  land: '#5a5335',
  terrain: '#6e6950',
  manMade: '#4e4838',
  park: '#372f14',
  water: '#344144',
  road: '#959358',
  roadMinor: '#7d7b4a',
  rail: '#23211b'
}

const lineWidth = (base: number): ExpressionSpecification => [
  'interpolate',
  ['exponential', 1.4],
  ['zoom'],
  12,
  base * 0.4,
  17,
  base * 3
]

/** MapLibre style imitating the Breath of the Wild map. No labels, so no glyphs are needed. */
export const zeldaStyle: StyleSpecification = {
  version: 8,
  sources: {
    openmaptiles: { type: 'vector', url: TILEJSON_URL }
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': colors.land } },
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['in', 'class', 'wood', 'grass'],
      paint: { 'fill-color': colors.terrain }
    },
    {
      id: 'landuse-green',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'cemetery', 'garden', 'pitch', 'playground'],
      paint: { 'fill-color': colors.park }
    },
    {
      id: 'park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: { 'fill-color': colors.park }
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': colors.water }
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: { 'line-color': colors.water, 'line-width': lineWidth(2) }
    },
    {
      id: 'building',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 14,
      paint: { 'fill-color': colors.manMade }
    },
    {
      id: 'rail',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'rail'],
      paint: { 'line-color': colors.rail, 'line-width': lineWidth(1) }
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'minor', 'service', 'track', 'path'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': colors.roadMinor, 'line-width': lineWidth(1.5) }
    },
    {
      id: 'road-major',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': colors.road, 'line-width': lineWidth(2.5) }
    }
  ]
}
