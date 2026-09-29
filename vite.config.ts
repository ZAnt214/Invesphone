import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Arquivo Morto',
        short_name: 'Arquivo Morto',
        description: 'Investigação criminal narrativa em formato found-phone.',
        theme_color: '#111315',
        background_color: '#111315',
        display: 'standalone',
        orientation: 'portrait'
      }
    })
  ]
})
