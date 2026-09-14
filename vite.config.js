import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const manifest = {
  name: 'Chakula',
  short_name: 'Chakula',
  description: 'Discover meals. Plan better. Cook smarter.',
  display: 'standalone',
  start_url: '/',
  scope: '/',
  orientation: 'portrait-primary',
  theme_color: '#e8590c',
  background_color: '#fff8f2',
  categories: ['food', 'lifestyle', 'utilities'],
  icons: [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ],
  shortcuts: [
    {
      name: 'Explore meals',
      short_name: 'Explore',
      url: '/explore',
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
    },
    {
      name: 'Random meal',
      short_name: 'Random',
      url: '/random',
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
    }
  ]
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.themealdb\.com\/api\/json\/v1\/1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mealdb-api-v1',
              networkTimeoutSeconds: 6,
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/www\.themealdb\.com\/images\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mealdb-images-v1',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})