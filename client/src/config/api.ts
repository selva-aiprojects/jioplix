function getBaseUrl() {
  if ((import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const port = window.location.port;

    // Port 3001: local dev Vite fallback → backend at 4000
    //            production SME deployment → 5001
    if (port === '3001') {
      const isLocalDev = ['localhost', '127.0.0.1', '::1'].includes(host);
      return `${window.location.protocol}//${host}:${isLocalDev ? '4000' : '5001'}`;
    }
    // Port 3000: Vite dev server (with proxy) or Docker → backend at 4000
    if (port === '3000') {
      return `${window.location.protocol}//${host}:4000`;
    }
    // Port 5173: raw Vite dev (no port override) → backend at 4000
    if (['localhost', '127.0.0.1', '::1'].includes(host)) {
      return 'http://localhost:4000';
    }
    // Production (Vercel / jioplix.com): same-origin API
    if (host.includes('vercel.app') || host.includes('jioplix')) {
      return window.location.origin;
    }
  }
  // SSR/build fallback
  return '';
}

export const API_BASE_URL = getBaseUrl();
