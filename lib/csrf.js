// lib/csrf.js
//
// Checks that the Origin header on POST/PUT/DELETE requests matches
// an allowed host, preventing cross-site request forgery.
// Usage: const { ok, error } = verifyCsrf(request)

const ALLOWED_HOSTS = [
  'rentatutor.co.zm',
  'www.rentatutor.co.zm',
  'admin.rentatutor.co.zm',
]

export function verifyCsrf(request) {
  const origin  = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // If no Origin, fall back to Referer header for CSRF validation.
  // Only skip checks for requests with neither (server-side fetches).
  const sourceUrl = origin || referer
  if (!sourceUrl) {
    // Extra safety: only allow missing origin/referer for non-browser contexts.
    // Check for common browser indicators.
    const ua = request.headers.get('user-agent') || ''
    if (/mozilla|chrome|safari|firefox|edge/i.test(ua)) {
      return { ok: false, error: 'Forbidden: missing origin' }
    }
    return { ok: true }
  }

  // In development allow localhost at any port
  if (process.env.NODE_ENV === 'development') {
    try {
      const { hostname } = new URL(sourceUrl)
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return { ok: true }
      }
    } catch {
      return { ok: false, error: 'Invalid origin' }
    }
  }

  try {
    const { hostname } = new URL(sourceUrl)
    if (ALLOWED_HOSTS.includes(hostname)) return { ok: true }
    return { ok: false, error: 'Forbidden: invalid origin' }
  } catch {
    return { ok: false, error: 'Forbidden: malformed origin' }
  }
}
