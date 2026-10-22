// Google Maps JSON style imitating the Breath of the Wild map.
// NOTE: JSON styling is deprecated by Google. This file is replaced when the map moves to MapLibre.
export const zeldaMapStyles = [
  {
    featureType: 'administrative',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#9d935e'
      }
    ]
  },
  {
    featureType: 'administrative',
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#3f3b28'
      }
    ]
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on'
      }
    ]
  },
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#5a5335'
      }
    ]
  },
  {
    featureType: 'landscape',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on'
      }
    ]
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#4e4838'
      },
      {
        visibility: 'on'
      }
    ]
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.stroke',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'landscape.natural',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on'
      }
    ]
  },
  {
    featureType: 'landscape.natural.terrain',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#6e6950'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#372f14'
      },
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'geometry.stroke',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.stroke',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      {
        visibility: 'on'
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#372f14'
      },
      {
        visibility: 'on'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'all',
    stylers: [
      {
        saturation: -100
      },
      {
        lightness: 45
      },
      {
        color: '#959358'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'all',
    stylers: [
      {
        visibility: 'simplified'
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [
      {
        weight: '1'
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.stroke',
    stylers: [
      {
        weight: '1'
      }
    ]
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.icon',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [
      {
        visibility: 'on'
      }
    ]
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on'
      },
      {
        color: '#23211b'
      },
      {
        weight: '1'
      }
    ]
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'transit.station.bus',
    elementType: 'all',
    stylers: [
      {
        visibility: 'on'
      }
    ]
  },
  {
    featureType: 'transit.station.bus',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'transit.station.bus',
    elementType: 'labels.text',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'transit.station.bus',
    elementType: 'labels.icon',
    stylers: [
      {
        visibility: 'on'
      }
    ]
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#344144'
      }
    ]
  },
  {
    featureType: 'water',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  }
]
