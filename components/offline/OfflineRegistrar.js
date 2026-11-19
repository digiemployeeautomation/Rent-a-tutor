'use client'
import { useEffect } from 'react'
import { ensureOfflineShell } from '@/lib/offline/sw-client'

// Registers the service worker that powers offline lessons (public/sw.js) and
// keeps the offline shell (the /downloads page + its files) up to date.
// Mounted once in the root layout. Renders nothing.
//
// Development: the worker is only registered when the URL has ?sw=1, so hot
// reload keeps working. Once registered it stays active for that browser
// profile (unregister it in DevTools > Application to switch it off again).
//
// Also remembers the browser's "install app" prompt so the Downloads page can
// offer it later: window.__ratInstallPrompt + a "rat:installable" event.
export default function OfflineRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    function onInstallPrompt(e) {
      e.preventDefault()
      window.__ratInstallPrompt = e
      window.dispatchEvent(new Event('rat:installable'))
    }
    function onInstalled() {
      window.__ratInstallPrompt = null
      window.dispatchEvent(new Event('rat:installable'))
    }
    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    if (!('serviceWorker' in navigator)) {
      return () => {
        window.removeEventListener('beforeinstallprompt', onInstallPrompt)
        window.removeEventListener('appinstalled', onInstalled)
      }
    }

    const dev = process.env.NODE_ENV !== 'production'
    const optedIn = window.location.search.includes('sw=1')

    // The worker itself skips the download when its copy is recent, so this
    // is cheap to call on every page load.
    function refreshShell() {
      if (navigator.onLine) ensureOfflineShell().catch(() => {})
    }

    async function start() {
      try {
        if (!dev || optedIn) {
          await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        }
        refreshShell()
      } catch {
        // Offline lessons are an extra — never break the page over them.
      }
    }

    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    window.addEventListener('online', refreshShell)

    return () => {
      window.removeEventListener('load', start)
      window.removeEventListener('online', refreshShell)
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])
  return null
}
