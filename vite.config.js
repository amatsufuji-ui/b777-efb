import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: { port: 5173, strictPort: true }, // アドレスを固定
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, // キャッシュの上限を5MBに引き上げる
        // 2026-11-16 追加: 既定では js/css/html しか precache されず、public の QR.png 等が
        // オフラインで読めなかったため、画像も precache 対象に含める
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: '7PT Master Perf EFB',
        short_name: '7PT',
        description: 'B777 Master Performance Tool',
        theme_color: '#05070a',
        background_color: '#05070a',
        display: 'standalone',
        icons: [
          {
            src: '/apple-touch-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
