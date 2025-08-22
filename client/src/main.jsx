import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import queryClient from './queryClient.js';
import { store } from './store/store.js';
import './index.css';

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}


// Performance monitoring
if (import.meta.env.MODE === 'docker') {
  // const mainStart = performance.now();
  // window.mainStart = mainStart;
  console.log = () => {}; // Disable console.log in production
  console.warn = () => {}; // Disable console.warn in production
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);

