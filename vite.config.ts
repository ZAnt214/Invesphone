import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

// Duas páginas: a raiz é a Varredura das Acácias (cena 2D do Caso 01) e o app
// Invesphone continua inteiro em /invesphone, para ser adaptado por cima depois.
const page = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: page('./index.html'),
        invesphone: page('./invesphone/index.html')
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        // sem isto o service worker entregaria a página inicial ao abrir /invesphone
        navigateFallbackDenylist: [/^\/invesphone/]
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
