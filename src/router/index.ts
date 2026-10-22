import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
      path: '/sensor',
      name: 'sensor',
      component: () => import('../views/apps/SensorApp.vue')
    },
    {
      path: '/camera',
      name: 'camera',
      component: () => import('../views/apps/CameraApp.vue')
    },
    {
      path: '/media',
      name: 'media',
      component: () => import('../views/apps/MediaApp.vue')
    },
    {
      path: '/reader',
      name: 'reader',
      component: () => import('../views/apps/ReaderApp.vue')
    }
  ]
})

export default router
