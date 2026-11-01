import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version)
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      //strategies: 'injectManifest',
      workbox: {
        // Cache everything the app needs so it keeps working offline in the field.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,ogg,mp3,webp,ttf,otf,mjs,webmanifest}'],
        navigateFallback: 'index.html',
        // Tiles seen once stay available offline (partial coverage until PMTiles are self-hosted).
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'SheikahPhone™',
        short_name: 'SheikahPhone',
        id: '/',
        start_url: '/',
        lang: 'de',
        orientation: 'portrait',
        description: '△△△',
        theme_color: '#3CD3FC',
        background_color: '#000000',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
