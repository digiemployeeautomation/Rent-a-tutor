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

  // ── Lazy profile fetcher — at most one DB read per request ──────────────────
  let _profile
  const getRole = async () => {
    if (!user) return null
    if (_profile === undefined) {
      const { data, error } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (error || !data) return null
      _profile = data
    }
    return _profile?.role ?? null
  }

  // ── Logged-in users hitting auth pages ─────────────────────────────────────
  if (user && AUTH_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    const role = await getRole()
    if (role === null)      return NextResponse.redirect(new URL('/auth/register', request.url))
    if (role === 'admin')   return NextResponse.redirect(new URL('/admin', request.url))
    if (role === 'tutor')   return NextResponse.redirect(new URL('/dashboard/tutor', request.url))
    if (role === 'student') return NextResponse.redirect(new URL('/dashboard/student', request.url))
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ── Unauthenticated: gate all protected routes ──────────────────────────────
  const isProtected = [...PROTECTED_ANY, ...ADMIN_ROUTES].some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!user) return response

  // ── Role-level route protection ─────────────────────────────────────────────
  const needsRole =
    PROTECTED_STUDENT.some(r => pathname.startsWith(r)) ||
    PROTECTED_TUTOR.some(r => pathname.startsWith(r))   ||
    ADMIN_ROUTES.some(r => pathname.startsWith(r))

  if (needsRole) {
    const role = await getRole()

    // Missing profile row — send back to register so the user can start fresh
    if (role === null) {
      return NextResponse.redirect(new URL('/auth/register', request.url))
    }

    // Admin routes — only admins allowed
    if (ADMIN_ROUTES.some(r => pathname.startsWith(r)) && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Tutor-only routes — tutors and admins allowed
    if (PROTECTED_TUTOR.some(r => pathname.startsWith(r)) && role !== 'tutor' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/student', request.url))
    }

    // Student-only routes — students and admins allowed
    if (PROTECTED_STUDENT.some(r => pathname.startsWith(r)) && role !== 'student' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/tutor', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
