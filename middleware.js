import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

const PROTECTED_STUDENT = ['/dashboard/student', '/onboarding', '/practice']
const PROTECTED_ANY     = ['/dashboard']
const ADMIN_ROUTES      = ['/admin']
const AUTH_ROUTES       = ['/auth/login', '/auth/register']

function withSecurityHeaders(response) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  return response
}

// Role comes from auth user_metadata, which is set at signup. The old
// `profiles` lookup was removed when we pivoted to IELTS — new users no
// longer have a row in that table, so the lookup always returned null
// and pushed users into a redirect loop.
function getRoleFromUser(user) {
  if (!user) return null
  return user.user_metadata?.role ?? 'student'
}

// Supabase auth-helpers store the session in cookies named
// `sb-<project-ref>-auth-token` (chunked as `.0`, `.1`, … for large
// tokens). If none are present the visitor is definitively logged out,
// so there is no point making a network round-trip to GoTrue — that
// blocking call on every anonymous request is what took the whole site
// down with MIDDLEWARE_INVOCATION_TIMEOUT when Supabase was slow to reach.
function hasAuthCookie(request) {
  return request.cookies.getAll().some(c => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
}

// Fail open: if validating the session takes too long (Supabase
// unreachable from this region, cold DB, etc.) treat the user as
// unauthenticated rather than hanging until the platform kills the
// function. Protected routes then bounce to login instead of 504-ing
// the entire site.
async function getUserWithTimeout(supabase, ms = 3000) {
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('auth-timeout')), ms)),
    ])
    return result?.data?.user ?? null
  } catch {
    return null
  }
}

export async function middleware(request) {
  const response = NextResponse.next()
  withSecurityHeaders(response)
  const { pathname } = request.nextUrl

  // Skip the auth network call entirely for logged-out visitors.
  const user = hasAuthCookie(request)
    ? await getUserWithTimeout(createMiddlewareClient({ req: request, res: response }))
    : null
  const role = getRoleFromUser(user)

  // ── Logged-in users hitting auth pages ─────────────────────────────────────
  if (user && AUTH_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    if (role === 'admin')   return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'student') return NextResponse.redirect(new URL('/dashboard/student', request.url))
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── Unauthenticated: gate all protected routes ──────────────────────────────
  const isProtected = [...PROTECTED_ANY, ...ADMIN_ROUTES, ...PROTECTED_STUDENT].some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!user) return response

  // ── Role-level route protection ─────────────────────────────────────────────
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r)) && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
