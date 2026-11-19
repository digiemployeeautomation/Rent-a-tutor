// lib/offline/sw-client.js
//
// CLIENT-ONLY. Small helpers for talking to the offline service worker
// (public/sw.js) from pages and components.

export function swSupported() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

// The active service worker for this site, or null (unsupported, or not
// registered — e.g. in development without ?sw=1).
export async function getActiveWorker() {
  if (!swSupported()) return null
  try {
    const reg = await navigator.serviceWorker.getRegistration('/')
    if (!reg) return null
    if (reg.active) return reg.active
    const ready = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(() => resolve(null), 15000)),
    ])
    return ready?.active || null
  } catch {
    return null
  }
}

// Ask the service worker to cache (or refresh) the offline shell: the
// /downloads page and the files it needs. Resolves with
//   { ok, supported, refreshed?, assets?, error? }
// ok = the Downloads page will open without a connection.
export async function ensureOfflineShell({ force = false, timeoutMs = 45000 } = {}) {
  const worker = await getActiveWorker()
  if (!worker) return { ok: false, supported: false }
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    const timer = setTimeout(() => resolve({ ok: false, supported: true, error: 'timeout' }), timeoutMs)
    channel.port1.onmessage = (event) => {
      clearTimeout(timer)
      resolve({ supported: true, ...event.data })
    }
    try {
      worker.postMessage({ type: 'cache-offline-shell', force }, [channel.port2])
    } catch (err) {
      clearTimeout(timer)
      resolve({ ok: false, supported: true, error: String(err) })
    }
  })
}

// Is the Downloads page already in the cache? (Works offline — no network.)
export async function isOfflineShellCached() {
  try {
    if (typeof caches === 'undefined') return false
    return !!(await caches.match('/downloads', { ignoreSearch: true, ignoreVary: true }))
  } catch {
    return false
  }
}

// Can we really reach the site right now? navigator.onLine only says whether
// the device has *a* connection — it stays true on Wi-Fi with no internet and
// on a mobile network with no data bundle. So when the browser says "online"
// we confirm with one tiny request (HEAD of a static icon: no page, no API,
// not answered by the service worker because it is not a GET).
export async function checkOnline({ timeoutMs = 5000 } = {}) {
  if (typeof navigator === 'undefined') return true
  if (navigator.onLine === false) return false
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = setTimeout(() => controller?.abort(), timeoutMs)
  try {
    const res = await fetch(`/icons/icon-192.png?ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store', signal: controller?.signal })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
