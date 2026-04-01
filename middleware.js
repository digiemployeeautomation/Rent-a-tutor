import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

const PROTECTED_STUDENT = ['/dashboard/student']
const PROTECTED_TUTOR   = ['/dashboard/tutor']
const PROTECTED_ANY     = ['/dashboard', '/messages', '/bookings']
const ADMIN_ROUTES      = ['/admin']
const AUTH_ROUTES       = ['/auth/login', '/auth/register']

export async function middleware(request) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  const supabase = createMiddlewareClient({ req: request, res: response })
  const { data: { user } } = await supabase.auth.getUser()

  // ── Logged-in users hitting auth pages ─────────────────────────────────────
  if (user && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role ?? 'student'
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'tutor') return NextResponse.redirect(new URL('/dashboard/tutor', request.url))
    return NextResponse.redirect(new URL('/dashboard/student', request.url))
  }

  // ── Unauthenticated: gate all protected routes ──────────────────────────────
  const isProtected = [...PROTECTED_ANY, ...ADMIN_ROUTES].some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!user) return response

  // ── Role-level route protection (requires DB read — only on mismatch paths) ─
  const needsRole =
    PROTECTED_STUDENT.some(r => pathname.startsWith(r)) ||
    PROTECTED_TUTOR.some(r => pathname.startsWith(r))   ||
    ADMIN_ROUTES.some(r => pathname.startsWith(r))

  if (needsRole) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role ?? 'student'

    // Admin routes
    if (ADMIN_ROUTES.some(r => pathname.startsWith(r)) && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Tutor-only routes
    if (PROTECTED_TUTOR.some(r => pathname.startsWith(r)) && role !== 'tutor') {
      return NextResponse.redirect(new URL('/dashboard/student', request.url))
    }

    // Student-only routes
    if (PROTECTED_STUDENT.some(r => pathname.startsWith(r)) && role !== 'student') {
      return NextResponse.redirect(new URL('/dashboard/tutor', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Exclude: static files, images, and ALL /api/* routes (they handle their own auth)
    '/((?!_next/static|_next/image|api/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
