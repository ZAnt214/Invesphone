import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Duas páginas: /base é a base do DHPP, onde o jogo começa (a raiz leva para lá, em vercel.json), e /casa é a
// Varredura das Acácias, a casa do crime, segunda parte do Caso 01. Não há mais aparelho nem chamada.
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
// arte oficial da rua americana que já chegou (public/base/rua/**.png): o jogo usa o que existe e desenha provisório no resto
const ruaDir = page('./public/base/rua')
const RUA_ART: string[] = []
if (existsSync(ruaDir)) { const walk = (d: string, rel: string) => { for (const e of readdirSync(d, { withFileTypes: true })) {
  if (e.isDirectory()) walk(join(d, e.name), rel + e.name + '/'); else if (e.name.endsWith('.png')) RUA_ART.push(rel + e.name) } }; walk(ruaDir, '') }

export default defineConfig({
  define: { __ART_CACHE__: JSON.stringify(ART_CACHE), __RUA_ART__: JSON.stringify(RUA_ART.sort()) },
  build: {
    rollupOptions: {
      input: {
        base: page('./base/index.html'),
        casa: page('./casa/index.html')
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
        globPatterns: ['**/*.{js,css,html,ico,woff2,svg}', 'thumbs/**/*.{jpg,webp}', 'base/rua/**/*.png', 'sonia.jpg'],
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith('/characters/') || url.pathname.startsWith('/evidence/'),
          handler: 'CacheFirst',
          options: { cacheName: ART_CACHE, expiration: { maxEntries: 600, purgeOnQuotaError: true } }
        }],
        // cada página tem o seu HTML: o service worker não troca uma pela outra
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/casa/, /^\/base/]
      },
      manifest: {
        name: 'Arquivo Morto',
        short_name: 'Arquivo Morto',
        description: 'Investigação criminal narrativa no DHPP.',
        start_url: '/base/',
        theme_color: '#050607',
        background_color: '#050607',
        display: 'standalone'
      }
    })
  ]
})
