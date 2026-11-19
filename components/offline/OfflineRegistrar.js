'use client'
import { useEffect } from 'react'

// Registers the service worker that powers offline lessons (public/sw.js).
// Renders nothing.
export default function OfflineRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production' && !window.location.search.includes('sw=1')) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
