import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// import basicSsl from '@vitejs/plugin-basic-ssl'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';

// Исправление для __dirname в ES модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // basicSsl(),
    VitePWA({
      strategies: 'generateSW', // Генерируем SW
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Или 'script' - авто обычно достаточно
      // 2. SW и Манифест будут в корне папки сборки (dist)
      filename: 'sw.js',
      manifestFilename: 'manifest.webmanifest',
      scope: '/',
      workbox: {
        // 3. Ищем файлы от корня папки сборки (dist)
        globDirectory: 'dist/',
        // 4. Включаем ТОЛЬКО все из папки assets
        globPatterns: [
          '**/*.{js,css,html,woff2,ttf,otf,eot,svg,ico,jpg,jpeg,gif}'
        ],
        // 5. modifyURLPrefix для /assets/
        modifyURLPrefix: {
            'assets/': '/assets/'
        },
        // 6. Fallback на корневой index.html для SPA маршрутизации
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /\.[^\/]+$/, // файлы с расширениями
          /^\/api\//,  // API маршруты
          /^\/static\//,
          /^\/upload_files\//,
          /^\/avatars\//,
          /^\/sounds\//,
          /^\/dashboard\//,
          /^\/temp\//,
          /^\/tasks\//,
          /^\/chat\//,
          /^\/memory\//,
          /^\/journals\//
        ]
      },
      manifest: {
        name: 'Secretary App',
        short_name: 'Secretary',
        start_url: '/',
        id: '/',
        display: 'standalone',
        orientation: 'portrait',
        description: 'Secretary Application',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        categories: ['productivity'],
        screenshots: [
          {
            src: '/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/screenshot-mobile.png',
            sizes: '750x1334',
            type: 'image/png'
          }
        ],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: false,
      }
    })
  ],
  build: {
    // 8. Стандартный вывод в dist/assets/
    outDir: 'dist',
    assetsDir: 'assets', // Явно указываем стандартную папку для ассетов
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      // 9. Убрана кастомная настройка output
      output: {
        manualChunks: {
             // ... ваши manualChunks ...
             'mui': ['@mui/material', '@mui/icons-material', '@mui/system'],
             'mui-x': ['@mui/x-tree-view', '@mui/x-date-pickers'],
             'react-vendor': ['react', 'react-dom', 'react-router-dom'],
             'utils': ['axios', 'dayjs'],
             'fullcalendar': ['@fullcalendar/core', '@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/list', '@fullcalendar/interaction', '@fullcalendar/rrule', '@fullcalendar/scrollgrid', '@fullcalendar/bootstrap5'],
             'blocknote': ['@blocknote/core', '@blocknote/mantine', '@blocknote/react'],
             'dnd': ['@hello-pangea/dnd', 'react-rnd'],
             'swiper': ['swiper']
        },
      }
    },
    // ... остальная конфигурация build ...
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    host: true,
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem')
    },
    proxy: {
      // Перенаправляем запросы, начинающиеся с '/api', на сервер Flask
      '/api': {
        target: 'https://localhost:5100',
        changeOrigin: true,
        secure: false
      },
      '/': {
        target: 'https://localhost:5100',
        changeOrigin: true,
        secure: false
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['__tests__/**/*.test.{js,jsx}'],
    threads: 1,
  },
})
