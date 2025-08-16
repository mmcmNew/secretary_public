import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/store/rtk-test-setup.js'],
    include: ['src/tests/store/**/*.test.js'],
    testTimeout: 40000, // Увеличиваем таймаут для сетевых запросов
    hookTimeout: 40000,
    teardownTimeout: 40000,
    // Настройки для работы с реальным сервером
    pool: 'forks', // Используем отдельные процессы для изоляции тестов
    poolOptions: {
      forks: {
        singleFork: true // Запускаем тесты последовательно
      }
    }
  },
  server: {
    // Прокси для тестов, чтобы обращаться к реальному серверу
    proxy: {
      '/api': {
        target: 'https://localhost:5100',
        changeOrigin: true,
        secure: false
      },
      '/demo': {
        target: 'https://localhost:5100',
        changeOrigin: true,
        secure: false
      }
    }
  }
});