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
  // Allow same-origin requests that come without an Origin header
  // (e.g. server-side fetch calls from Next.js itself)
  const origin = request.headers.get('origin')
  if (!origin) return { ok: true }

  // In development allow localhost at any port
  if (process.env.NODE_ENV === 'development') {
    try {
      const { hostname } = new URL(origin)
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return { ok: true }
      }
    } catch {
      return { ok: false, error: 'Invalid origin' }
    }
  }

  try {
    const { host } = new URL(origin)
    if (ALLOWED_HOSTS.includes(host)) return { ok: true }
    return { ok: false, error: 'Forbidden: invalid origin' }
  } catch {
    return { ok: false, error: 'Forbidden: malformed origin' }
  }
}
