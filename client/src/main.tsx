import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'
import OfflineIndicator from './components/OfflineIndicator.tsx'
import { OfflineProvider } from './lib/offline/OfflineContext.tsx'
import { initAnalytics } from './utils/analytics';
import './index.css'

// Initialize PostHog Analytics
initAnalytics();

// Register the offline app-shell service worker (production builds only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <OfflineProvider>
        <App />
        <OfflineIndicator />
      </OfflineProvider>
    </ToastProvider>
  </React.StrictMode>,
)
