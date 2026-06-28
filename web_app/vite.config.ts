import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Keuanganku',
        short_name: 'Keuanganku',
        description: 'Dashboard keuangan & bot WhatsApp pribadi',
        theme_color: '#0B0F19',
        background_color: '#0B0F19',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache semua aset statis
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // API calls tidak di-cache (selalu fresh dari server)
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        // Aktifkan PWA juga saat development (untuk testing)
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/webhook': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
