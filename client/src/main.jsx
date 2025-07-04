import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

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

// Automatically attach JWT token stored in localStorage to all fetch requests
const originalFetch = window.fetch
window.fetch = (input, init = {}) => {
  const token = localStorage.getItem('access_token')
  const headers = new Headers(init.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return originalFetch(input, { ...init, headers })
}

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  const mainStart = performance.now();
  window.mainStart = mainStart;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
