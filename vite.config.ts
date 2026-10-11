import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Três páginas: a raiz é a Varredura das Acácias (cena 2D do Caso 01), /base é a base do
// DHPP (outra cena 2D) e o app Invesphone continua inteiro em /invesphone.
const page = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// nome do cache das ilustrações/evidências: muda quando algum arquivo muda, para o aparelho baixar a versão nova
const artHash = (() => {
  const h = createHash('sha1')
  const walk = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const f = join(d, e.name); if (e.isDirectory()) walk(f); else { h.update(f); h.update(readFileSync(f)) } } }
  for (const d of ['characters', 'evidence']) walk(page('./public/' + d))
  return h.digest('hex').slice(0, 10)
})()
const ART_CACHE = 'case-art-' + artHash

export default defineConfig({
  define: { __ART_CACHE__: JSON.stringify(ART_CACHE) },
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
        // instala só o app (código, fontes, ícones e as versões leves do quadro); as ilustrações e evidências
        // grandes vêm pelo carregador do jogo (src/preload) e ficam no cache ART_CACHE, que o worker serve sem rede
        globPatterns: ['**/*.{js,css,html,ico,woff2,svg}', 'thumbs/**/*.{jpg,webp}', 'sonia.jpg'],
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith('/characters/') || url.pathname.startsWith('/evidence/'),
          handler: 'CacheFirst',
          options: { cacheName: ART_CACHE, expiration: { maxEntries: 600, purgeOnQuotaError: true } }
        }],
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
