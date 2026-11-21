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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // 2026-11-21 追加: 予想断面・予想平面 (www3.metair.go.jp) のオフライン表示。
        // metair には CORS ヘッダーが無く、ページ側の fetch では本文を読めない
        // (iPad Safari では no-cors の本文が取り出せなかった) ため、Service Worker
        // の runtime cache で <img> の応答 (opaque, status 0) をそのまま保存し、
        // オフライン時は SW がキャッシュから返す。GET WX 時に NavlogView が
        // 予想フレームを <img> で先読みして、このキャッシュに載せる。
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www3\.metair\.go\.jp\/pict\/anl\/.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wx-metair-fcst-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 160, maxAgeSeconds: 60 * 60 * 48 }
            }
          },
          {
            // 実況の断面・平面 (data.jma.go.jp maiji) も同じ方式で保存する。
            // GET WX の IndexedDB 保存は自動選択した3セット分だけだが、SW
            // キャッシュならビューアで一度開いた (または先読みした) 路線・
            // 経度・FL のフレームもオフラインで再表示できる (2026-11-21 追加)。
            urlPattern: /^https:\/\/www\.data\.jma\.go\.jp\/airinfo\/data\/pict\/maiji\/.*\.PNG$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wx-jma-anl-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 240, maxAgeSeconds: 60 * 60 * 48 }
            }
          }
        ]
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
