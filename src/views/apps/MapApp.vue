<script setup lang="ts">
import { GoogleMap, Marker, CustomMarker } from 'vue3-google-map'
import { computed, ref, onMounted, onUnmounted } from 'vue'

import ClockWidget from './../../components/widgets/ClockWidget.vue'
import WeatherWidget from './../../components/widgets/WeatherWidget.vue'

import markerIconHome from './../../assets/images/map/home.png'
import markerIconPalace from './../../assets/images/map/palace.png'
import markerIconCastle from './../../assets/images/map/castle.png'
import markerIconGate from './../../assets/images/map/gate.png'
import markerIconFountain from './../../assets/images/map/fountain.png'
import markerIconStable from './../../assets/images/map/stable.png'

const zeldaMapStyles = [
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
const markers = [
  {
    name: 'Ludwigsburg',
    position: {
      lat: 48.897551,
      lng: 9.191567
    },
    icon: markerIconHome
  },
  {
    name: 'Palast',
    position: {
      lat: 48.899614,
      lng: 9.195613
    },
    icon: markerIconPalace
  },
  {
    name: 'Schloß Favorite',
    position: {
      lat: 48.904458,
      lng: 9.196029
    },
    icon: markerIconCastle
  },
  {
    name: 'Schloß Monrepos',
    position: {
      lat: 48.9106168,
      lng: 9.177179
    },
    icon: markerIconCastle
  },
  {
    name: 'Burg Hohenegge',
    position: {
      lat: 48.9147811,
      lng: 9.2062516
    },
    icon: markerIconCastle
  },
  {
    name: 'Turm des Waldes',
    position: {
      lat: 48.88450369407149,
      lng: 9.196850687540637
    },
    icon: markerIconCastle
  },
  {
    name: 'Heilbronner Torhaus',
    position: {
      lat: 48.9022941,
      lng: 9.1912123
    },
    icon: markerIconGate
  },
  {
    name: 'Stuttgarter Torhaus',
    position: {
      lat: 48.888894,
      lng: 9.189103
    },
    icon: markerIconGate
  },
  {
    name: 'Schorndorfer Torhaus',
    position: {
      lat: 48.8945931,
      lng: 9.1740354
    },
    icon: markerIconGate
  },
  {
    name: 'Pflugfelder Torhaus',
    position: {
      lat: 48.8904332,
      lng: 9.1837984
    },
    icon: markerIconGate
  },
  {
    name: 'Aldinger Torhaus',
    position: {
      lat: 48.8945931,
      lng: 9.1740354
    },
    icon: markerIconGate
  },
  {
    name: 'Asperger Torhaus',
    position: {
      lat: 48.8945931,
      lng: 9.1781185
    },
    icon: markerIconGate
  },
  {
    name: 'Marbacher Torhaus',
    position: {
      lat: 48.90254995369686,
      lng: 9.20048606997646
    },
    icon: markerIconGate
  },
  {
    name: 'Feenquelle',
    position: {
      lat: 48.910015,
      lng: 9.214296
    },
    icon: markerIconFountain
  },
  {
    name: 'Quelle der Macht',
    position: {
      lat: 48.9001518187164,
      lng: 9.195957220987154
    },
    icon: markerIconFountain
  },
  {
    name: 'Quelle des Ursprungs',
    position: {
      lat: 48.89743145785699,
      lng: 9.191552095298437
    },
    icon: markerIconFountain
  },
  {
    name: 'Quelle der Träume',
    position: {
      lat: 48.8930817,
      lng: 9.1928228
    },
    icon: markerIconFountain
  },
  {
    name: 'Quelle des Waldes',
    position: {
      lat: 48.907568,
      lng: 9.1947786
    },
    icon: markerIconFountain
  },
  {
    name: 'Quelle der Weisheit',
    position: {
      lat: 48.91474712899295,
      lng: 9.211257210034384
    },
    icon: markerIconFountain
  },
  {
    name: 'Stall der Prinzessin',
    position: {
      lat: 48.9021607,
      lng: 9.1838877
    },
    icon: markerIconStable
  },
  {
    name: 'Gerudo Stätte',
    position: {
      lat: 48.9070897,
      lng: 9.1977192
    },
    icon: markerIconHome
  },
  {
    name: 'Steinbruch der Goronen',
    position: {
      lat: 48.907582,
      lng: 9.2161755
    },
    icon: markerIconHome
  },
  {
    name: 'Kakariko',
    position: {
      lat: 48.91361403351804,
      lng: 9.211315271724766
    },
    icon: markerIconHome
  },
  {
    name: 'Reich der Zora',
    position: {
      lat: 48.910297,
      lng: 9.2122332
    },
    icon: markerIconHome
  },
  {
    name: 'Kurhotel',
    position: {
      lat: 48.90973260393466,
      lng: 9.214576968240936
    },
    icon: markerIconHome
  },
  {
    name: 'Vergessene Wälder',
    position: {
      lat: 48.89686900463565,
      lng: 9.163170767901905
    },
    icon: markerIconStable
  },
  {
    name: 'Zugstation Ludwigsburg',
    position: {
      lat: 48.892308609476544,
      lng: 9.185691454480875
    },
    icon: markerIconStable
  },
  {
    name: 'Bahnhof Ludwigsburg',
    position: {
      lat: 48.892308609476544,
      lng: 9.185691454480875
    },
    icon: markerIconStable
  },
  {
    name: 'Bahnhof Favoritepark',
    position: {
      lat: 48.9056801,
      lng: 9.187429
    },
    icon: markerIconStable
  },
  {
    name: 'Bahnhof Osterholz',
    position: {
      lat: 48.8976333338004,
      lng: 9.163368967922386
    },
    icon: markerIconStable
  }
]

interface GoogleMapsPosition {
  lat: number
  lng: number
}

interface GeolocationPosition {
  position: {
    coords: {
      latitude: number
      longitude: number
    }
  }
}

let isActiveDelayTimer: number
let geolocationWatcher: number
const geolocationWatcherOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
}
const userPosition = ref({ lat: 48.897551, lng: 9.191567 })
const userRotation = ref(0)
const mapCenter = ref(userPosition.value)
const isActive = ref(false)

onMounted(() => {
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientationabsolute', handleDeviceOrientationChange, true)
  }
  if (navigator.geolocation) {
    updateUserPosition()
    geolocationWatcher = navigator.geolocation.watchPosition(
      updateUserPosition,
      updateUserPositionError,
      geolocationWatcherOptions
    )
    showMapWithDelay()
  }
})

onUnmounted(() => {
  //clearInterval(updateInterval)
  if (window.DeviceOrientationEvent) {
    window.removeEventListener('deviceorientationabsolute', handleDeviceOrientationChange)
  }
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(geolocationWatcher)
  }
})

function showMapWithDelay(): void {
  isActiveDelayTimer = setTimeout(() => {
    isActive.value = true
  }, 2500)
}

function handleDeviceOrientationChange(event: DeviceOrientationEvent) {
  const alpha: number | null = event.alpha
  const beta: number | null = event.beta
  const gamma: number | null = event.gamma
  if (alpha && beta && gamma) {
    userRotation.value = compassHeading(alpha, beta, gamma)
  }
}

// From http://w3c.github.io/deviceorientation/spec-source-orientation.html#worked-example
function compassHeading(alpha: number, beta: number, gamma: number) {
  // Convert degrees to radians
  var alphaRad = alpha * (Math.PI / 180)
  var betaRad = beta * (Math.PI / 180)
  var gammaRad = gamma * (Math.PI / 180)

  // Calculate equation components
  var cA = Math.cos(alphaRad)
  var sA = Math.sin(alphaRad)
  var cB = Math.cos(betaRad)
  var sB = Math.sin(betaRad)
  var cG = Math.cos(gammaRad)
  var sG = Math.sin(gammaRad)

  // Calculate A, B, C rotation components
  var rA = -cA * sG - sA * sB * cG
  var rB = -sA * sG + cA * sB * cG
  var rC = -cB * cG

  // Calculate compass heading
  var compassHeading = Math.atan(rA / rB)

  // Convert from half unit circle to whole unit circle
  if (rB < 0) {
    compassHeading += Math.PI
  } else if (rA < 0) {
    compassHeading += 2 * Math.PI
  }

  // Convert radians to degrees
  compassHeading *= 180 / Math.PI

  return compassHeading
}

function updateUserPosition() {
  navigator.geolocation.getCurrentPosition(updateUserCoords, updateUserPositionError)
}

function updateUserCoords(position: any) {
  userPosition.value = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  }
}

function updateUserPositionError(error: any) {
  console.error(`ERROR(${error.code}): ${error.message}`)
}

function centerMapOnUser() {
  mapCenter.value = userPosition.value
}

const userLocationMarker: any = computed(() => {
  const updatedLocationMarker = {
    anchorPoint: 'CENTER',
    position: userPosition.value,
    offsetX: 0,
    offsetY: 0,
    zIndex: 999
  }
  return updatedLocationMarker
})
</script>

<template>
  <div class="App">
    <GoogleMap
      class="App-map"
      api-key="AIzaSyAZDM90Vj7VhIDu4HNte6NDYhZ2OqGFiFg"
      :center="mapCenter"
      :zoom="17"
      :disable-default-ui="true"
      :styles="zeldaMapStyles"
      v-if="isActive"
    >
      <CustomMarker :options="userLocationMarker">
        <div
          class="App-map-position"
          :style="{ transform: 'rotate(' + userRotation + 'deg)' }"
        ></div>
      </CustomMarker>

      <Marker
        :key="index"
        v-for="(marker, index) in markers"
        :options="marker"
        @click="console.log(marker.name)"
      />
    </GoogleMap>

    <Transition name="fade" delay="1000" appear>
      <div v-if="isActive">
        <div class="App-map-button App-map-button--recenter" @click="centerMapOnUser"></div>

        <div class="App-map-widgets">
          <WeatherWidget />
          <ClockWidget />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="stylus" scoped>
.App
    width 100%
    height 100%
    position relative
    background url(@/assets/images/map/background.jpg) repeat

    &-map
        width 100%
        height 100%

        &-position
            background url(@/assets/images/map/user.svg) center no-repeat
            background-size contain
            width 50px
            height 50px

        &-button
            width 80px
            height 80px
            position absolute
            bottom 60px
            right 20px
            z-index 100
            display block
            cursor pointer

            &:hover

                &:after
                    background rgba(0, 0, 0, 0.8)

                &:before
                    border-image url(@/assets/images/ui/frame-hover.svg) 10 / 20px

            &:after
                content " "
                display block
                position absolute
                z-index 1
                top 10px
                left 10px
                width calc(100% - 20px)
                aspect-ratio 1/1
                background rgba(0, 0, 0, 0.4)


            &:before
                content " "
                display block
                width 100%
                aspect-ratio 1/1
                border-image url(@/assets/images/ui/frame.svg) 10 / 20px
                background transparent center no-repeat
                background-size 45%
                pointer-events none
                position relative
                z-index 10

            &--recenter
                &:before
                    background-image url(@/assets/images/ui/icons/recenter.svg)
                    background-size 55%


        /*
          the following implementation is buggy...
          TODO: style widgets internal, controlled by mode attr? or by context?
        */
        &-widgets
            position absolute
            top 100px
            right 20px
            gap 0

            .WeatherWidget
                justify-content flex-end

            .ClockWidget
                font-size 1.5em
</style>
