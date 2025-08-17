import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  globals: true,
  // Disable worker threads to avoid too many open files (EMFILE) on Windows
  threads: false,
  maxThreads: 1,
    setupFiles: ['./src/tests/store/rtk-test-setup.js'],
  // Include both store tests and component tests (js and jsx)
  include: ['src/tests/store/**/*.test.js', 'src/tests/components/**/*.test.{js,jsx}'],
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