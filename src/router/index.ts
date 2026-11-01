import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useYigaMode } from '../composables/useYigaMode'
import { isRouteAvailable } from '../game/apps'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/map',
      name: 'map',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/apps/MapApp.vue')
    },
    {
      path: '/camera',
      name: 'camera',
      component: () => import('../views/apps/CameraApp.vue')
    },
    {
      path: '/scanner',
      name: 'scanner',
      component: () => import('../views/apps/ScannerApp.vue')
    },
    {
      path: '/media',
      name: 'media',
      component: () => import('../views/apps/MediaApp.vue')
    },
    {
      path: '/yiga',
      name: 'yiga',
      component: () => import('../views/apps/YigaApp.vue')
    }
  ]
})

const { mode } = useYigaMode()

// Each mode has its own set of apps: deep links and stale history entries fall back to the home screen.
router.beforeEach((to) => (isRouteAvailable(to.path, mode.value) ? true : { name: 'home' }))

watch(mode, () => {
  if (!isRouteAvailable(router.currentRoute.value.path, mode.value))
    router.replace({ name: 'home' })
})

export default router
