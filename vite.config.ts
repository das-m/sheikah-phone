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
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'SheikahPhone™',
        short_name: 'SheikahPhone',
        description: '△△△',
        theme_color: '#3CD3FC',
        background_color: '#000000',
        display: 'standalone',
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
  //css: {
  //  loaderOptions: {
  //    stylus: {
  //      use: [require('rupture')()],
  //      import: ['~rupture/rupture/index.styl']
  //    }
  //  }
  //}
})
