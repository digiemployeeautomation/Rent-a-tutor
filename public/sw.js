/* public/sw.js — Rent a Tutor offline service worker (hand-written, no build step).
 *
 * What it does
 *   1. Keeps an "offline shell": the /downloads document plus every
 *      /_next/static asset that document needs (scripts, css, fonts). It is
 *      cached on install and refreshed whenever a page asks for it
 *      (postMessage { type: 'cache-offline-shell' }).
 *   2. Navigations are network-first. With no network: the cached copy of that
 *      page if there is one, otherwise a redirect to the cached /downloads
 *      library, so an offline student lands on their saved lessons.
 *   3. /_next/static/** is cache-first when the file name is content-hashed
 *      (every production build file), network-first otherwise (development
 *      chunks are not hashed, so cache-first would serve stale code). Icons
 *      and the manifest are stale-while-revalidate.
 *   4. Never touches /api/**, other origins (Supabase), non-GET requests, or
 *      Next.js RSC data requests — those go straight to the network so they
 *      fail fast offline and Next falls back to a full navigation (see 2).
 *
 * Registered by components/offline/OfflineRegistrar.js (in development only
 * when the URL has ?sw=1).
 */

const VERSION = 'v2'
const PAGES = `rat-pages-${VERSION}`
const STATIC = `rat-static-${VERSION}`

const SHELL = '/downloads'
const SHELL_META = '/__offline/shell-meta'
const SHELL_FRESH_MS = 10 * 60 * 1000
const SHELL_NAV_TIMEOUT_MS = 4000
const MAX_PAGES = 40
const MAX_STATIC = 400
const EXTRAS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
]

// ── helpers ──────────────────────────────────────────────────────────────────

function keyFor(href) {
  const url = new URL(href, self.location.origin)
  return url.origin + url.pathname
}

// Production build files carry a content hash in their name
// (webpack-0b5d8249fb15f5f3.js, css/5b2fa1f7b1c8e4d2.css, media/e4af272c-s.p.woff2),
// so a cached copy can never be out of date. Development files do not.
const HASHED = /[-./][0-9a-f]{8,}(?:-s)?(?:\.p)?\.[a-z0-9]+$/i

function isHashed(href) {
  return HASHED.test(new URL(href, self.location.origin).pathname)
}

function isHtml(res) {
  return (res.headers.get('content-type') || '').includes('text/html')
}

function isCacheableDoc(res) {
  return !!res && res.status === 200 && res.type === 'basic' && !res.redirected && isHtml(res)
}

function shouldCachePage(url) {
  return url.pathname === SHELL || url.pathname.startsWith('/learn/high-school')
}

function isExtra(url) {
  return url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/icon.svg' || url.pathname === '/favicon.ico'
}

function isRscRequest(request, url) {
  return url.searchParams.has('_rsc') || request.headers.get('RSC') === '1' ||
    request.headers.has('Next-Router-Prefetch') || request.headers.has('Next-Router-State-Tree')
}

// Every /_next/static asset a document refers to: script/link tags, font
// preloads, and chunk paths inside the inline React flight data (which are
// written without the "/_next/" prefix).
function extractAssets(html) {
  const found = new Set()
  const add = (path) => {
    const clean = path.replace(/&amp;/g, '&')
    if (clean.startsWith('/_next/static/webpack/')) return // dev hot-update files
    found.add(clean)
  }
  for (const m of html.matchAll(/\/_next\/static\/[^"'\\\s<>()]+/g)) add(m[0])
  for (const m of html.matchAll(/(?:^|[^\w/.-])(static\/(?:chunks|css|media)\/[^"'\\\s<>()]+)/g)) add(`/_next/${m[1]}`)
  return [...found]
}

function extractCssAssets(css) {
  const found = new Set()
  for (const m of css.matchAll(/url\(\s*["']?(\/_next\/static\/[^"')\s]+)/g)) found.add(m[1])
  return [...found]
}

// Fetch one static asset into the cache. Hashed files already in the cache
// are kept as they are; anything else is fetched again.
// Returns 'ok' (cached), 'gone' (the server says it does not exist) or 'failed' (try again later).
async function cacheAsset(cache, href) {
  const key = keyFor(href)
  const hashed = isHashed(href)
  if (hashed && await cache.match(key)) return 'ok'
  let res
  try {
    res = await fetch(new URL(href, self.location.origin).href, { credentials: 'same-origin', cache: hashed ? 'default' : 'no-store' })
  } catch {
    return (await cache.match(key)) ? 'ok' : 'failed'
  }
  if (res.status === 404 || res.status === 410) return 'gone'
  if (!res.ok) return 'failed'
  let nested = []
  if (key.endsWith('.css')) {
    try { nested = extractCssAssets(await res.clone().text()) } catch {}
  }
  await cache.put(key, res)
  const results = await Promise.all(nested.map((n) => cacheAsset(cache, n).catch(() => 'failed')))
  return results.includes('failed') ? 'failed' : 'ok'
}

// A clean copy of a document for the cache: no Vary (so it matches any later
// navigation), and a timestamp so we know how old it is.
async function toStoredDoc(res) {
  const headers = new Headers()
  res.headers.forEach((value, name) => {
    if (!['vary', 'content-encoding', 'content-length', 'transfer-encoding', 'set-cookie'].includes(name.toLowerCase())) headers.set(name, value)
  })
  headers.set('X-Offline-Cached-At', String(Date.now()))
  return new Response(await res.blob(), { status: 200, headers })
}

async function matchPage(pathname) {
  const cache = await caches.open(PAGES)
  return cache.match(keyFor(pathname))
}

async function readShellMeta() {
  try {
    const res = await matchPage(SHELL_META)
    return res ? await res.json() : null
  } catch {
    return null
  }
}

// Cache a document together with its assets. `res` may be a response we
// already have (from a navigation); otherwise the page is fetched.
// The document is only stored when its assets are available, so we never
// replace a working offline page with one that cannot start.
async function cachePage(pathname, res) {
  if (!res) {
    res = await fetch(pathname, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'text/html' } })
  }
  if (!isCacheableDoc(res)) throw new Error(`cannot cache ${pathname} (status ${res && res.status})`)
  const html = await res.clone().text()
  const assets = extractAssets(html)
  const staticCache = await caches.open(STATIC)
  const results = await Promise.all(assets.map((a) => cacheAsset(staticCache, a).catch(() => 'failed')))
  const failed = results.filter((r) => r === 'failed').length
  const pages = await caches.open(PAGES)
  const existing = await pages.match(keyFor(pathname))
  if (failed > 0 && existing) throw new Error(`${failed} assets could not be fetched; keeping the previous copy`)
  await pages.put(keyFor(pathname), await toStoredDoc(res))
  return { assets: assets.filter((_, i) => results[i] === 'ok'), failed }
}

async function trimPages() {
  const cache = await caches.open(PAGES)
  const keys = (await cache.keys()).filter((r) => {
    const p = new URL(r.url).pathname
    return p !== SHELL && p !== SHELL_META
  })
  for (const request of keys.slice(0, Math.max(0, keys.length - MAX_PAGES))) await cache.delete(request)
}

// After a new deployment the shell points at new chunk files. Drop the old
// shell's files and any other cached pages (they reference the old build too).
async function cleanAfterShellChange(oldAssets, newAssets) {
  const keep = new Set(newAssets.map(keyFor))
  const staticCache = await caches.open(STATIC)
  for (const a of oldAssets) {
    if (!keep.has(keyFor(a))) await staticCache.delete(keyFor(a))
  }
  const pages = await caches.open(PAGES)
  for (const request of await pages.keys()) {
    const p = new URL(request.url).pathname
    if (p !== SHELL && p !== SHELL_META) await pages.delete(request)
  }
  const keys = await staticCache.keys()
  let extra = keys.length - MAX_STATIC
  for (const request of keys) {
    if (extra <= 0) break
    if (keep.has(keyFor(request.url))) continue
    await staticCache.delete(request)
    extra -= 1
  }
}

let shellJob = null

// Make sure the offline shell is in the cache. Resolves with
//   { ok, refreshed, cachedAt, assets, error? }
// ok = a usable shell is cached (even if this refresh attempt failed).
function ensureShell(force) {
  if (shellJob) return shellJob
  shellJob = (async () => {
    const existing = await matchPage(SHELL)
    const cachedAt = existing ? Number(existing.headers.get('X-Offline-Cached-At')) || 0 : 0
    const meta = await readShellMeta()
    if (existing && !force && Date.now() - cachedAt < SHELL_FRESH_MS) {
      return { ok: true, refreshed: false, cachedAt, assets: meta?.assets?.length ?? 0 }
    }
    try {
      const { assets, failed } = await cachePage(SHELL)
      const staticCache = await caches.open(STATIC)
      await Promise.all(EXTRAS.map((e) => cacheAsset(staticCache, e).catch(() => 'failed')))
      const pages = await caches.open(PAGES)
      await pages.put(keyFor(SHELL_META), new Response(JSON.stringify({ assets, cachedAt: Date.now() }), { headers: { 'Content-Type': 'application/json' } }))
      // Compare by file (ignoring ?v= / ?dpl= query strings): a new deployment
      // always renames at least one chunk.
      const old = meta?.assets || []
      const current = new Set(assets.map(keyFor))
      const changed = old.some((a) => !current.has(keyFor(a)))
      if (changed) await cleanAfterShellChange(old, assets)
      return { ok: failed === 0, refreshed: true, cachedAt: Date.now(), assets: assets.length, failed }
    } catch (err) {
      return { ok: !!existing, refreshed: false, cachedAt, assets: meta?.assets?.length ?? 0, error: String(err && err.message || err) }
    }
  })()
  const done = () => { shellJob = null }
  shellJob.then(done, done)
  return shellJob
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
}

const OFFLINE_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>You are offline · Rent a Tutor</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F9F9F7;color:#0F1713;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}main{max-width:26rem;text-align:center}h1{font-size:1.5rem;margin:0 0 .5rem}p{color:#45504A;line-height:1.6;margin:0 0 1.25rem}a{display:inline-block;background:#0F5337;color:#F8F7EE;text-decoration:none;font-weight:600;padding:.75rem 1.25rem;border-radius:.5rem}</style></head><body><main><h1>You are offline</h1><p>This page needs an internet connection. Lessons you saved for offline use are in your Downloads once the app has been opened online at least one time.</p><a href="/downloads">Open Downloads</a></main></body></html>`

// ── lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  self.skipWaiting()
  // Never fail the install because the network is bad — the shell is retried
  // every time a page is opened online.
  event.waitUntil(ensureShell(true).catch(() => {}))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((n) => n.startsWith('rat-') && n !== PAGES && n !== STATIC).map((n) => caches.delete(n)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', (event) => {
  const data = event.data
  const type = typeof data === 'string' ? data : data && data.type
  if (type !== 'cache-offline-shell') return
  const reply = (message) => {
    const target = (event.ports && event.ports[0]) || event.source
    try { if (target) target.postMessage({ type: 'offline-shell', ...message }) } catch {}
  }
  event.waitUntil(
    ensureShell(!!(data && data.force)).then(reply, (err) => reply({ ok: false, error: String(err) }))
  )
})

// ── fetch strategies ─────────────────────────────────────────────────────────

async function handleNavigation(event, url) {
  const request = event.request
  const cached = await matchPage(url.pathname)
  try {
    // The Downloads page is fully client-side, so on a very slow connection a
    // cached copy is as good as a fresh one — do not keep the student waiting.
    const response = url.pathname === SHELL && cached
      ? await Promise.race([fetch(request), timeout(SHELL_NAV_TIMEOUT_MS)])
      : await fetch(request)
    if (shouldCachePage(url) && isCacheableDoc(response)) {
      const copy = response.clone()
      event.waitUntil(cachePage(url.pathname, copy).then(trimPages).catch(() => {}))
    }
    return response
  } catch {
    if (cached) return cached
    if (await matchPage(SHELL)) return Response.redirect(SHELL, 302)
    return new Response(OFFLINE_PAGE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
}

async function staticCacheFirst(event, url) {
  const cache = await caches.open(STATIC)
  const key = keyFor(url.href)
  const hit = await cache.match(key)
  if (hit) return hit
  const response = await fetch(event.request)
  if (response.ok && response.type === 'basic') {
    const copy = response.clone()
    event.waitUntil(cache.put(key, copy).catch(() => {}))
  }
  return response
}

async function staticNetworkFirst(event, url) {
  const cache = await caches.open(STATIC)
  const key = keyFor(url.href)
  try {
    const response = await fetch(event.request)
    if (response.ok && response.type === 'basic') {
      const copy = response.clone()
      event.waitUntil(cache.put(key, copy).catch(() => {}))
    }
    return response
  } catch (err) {
    const hit = await cache.match(key)
    if (hit) return hit
    throw err
  }
}

async function staleWhileRevalidate(event, url) {
  const cache = await caches.open(STATIC)
  const key = keyFor(url.href)
  const hit = await cache.match(key)
  const refresh = fetch(event.request).then((response) => {
    if (response.ok && response.type === 'basic') cache.put(key, response.clone()).catch(() => {})
    return response
  })
  if (hit) {
    event.waitUntil(refresh.catch(() => {}))
    return hit
  }
  return refresh
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // Supabase and anything else external
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event, url))
    return
  }

  // Next.js client-side navigation data. Never answered from the cache: when
  // offline it must fail so Next does a full page load, handled above.
  if (isRscRequest(request, url)) return

  if (url.pathname.startsWith('/_next/static/')) {
    if (url.pathname.startsWith('/_next/static/webpack/')) return // dev hot-update files
    event.respondWith(isHashed(url.href) ? staticCacheFirst(event, url) : staticNetworkFirst(event, url))
    return
  }

  if (isExtra(url)) event.respondWith(staleWhileRevalidate(event, url))
})
