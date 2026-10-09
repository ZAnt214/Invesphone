import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

// Três páginas: a raiz é a Varredura das Acácias (cena 2D do Caso 01), /base é a base do
// DHPP (outra cena 2D) e o app Invesphone continua inteiro em /invesphone.
const page = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: page('./index.html'),
        invesphone: page('./invesphone/index.html'),
        base: page('./base/index.html')
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff2}'],
        // sem isto o service worker entregaria a página inicial ao abrir /invesphone
        navigateFallbackDenylist: [/^\/invesphone/, /^\/base/]
      },
      manifest: {
        name: 'Arquivo Morto',
        short_name: 'Arquivo Morto',
        description: 'Investigação criminal narrativa em formato found-phone.',
        theme_color: '#050607',
        background_color: '#050607',
        display: 'standalone'
      }
    })
  ]
})
