import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

const PROTECTED_ROUTES  = ['/dashboard', '/messages', '/bookings']
const ADMIN_ROUTES      = ['/admin']
// Pages logged-in users should not see
const AUTH_ROUTES       = ['/auth/login', '/auth/register']

export async function middleware(request) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  const supabase = createMiddlewareClient({ req: request, res: response })
  const { data: { user } } = await supabase.auth.getUser()

  // ── Logged-in users hitting auth pages ─────────────────────────────────
  if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'student'

    // Admins have no business on /auth/* — send straight to admin dashboard
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (role === 'tutor') {
      return NextResponse.redirect(new URL('/dashboard/tutor', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard/student', request.url))
  }

  // ── Register page: remove 'admin' as a selectable role ─────────────────
  // (actual enforcement is in the register page UI — see app/auth/register/page.js)

  // ── Protected routes: must be logged in ────────────────────────────────
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Admin routes: must be logged in AND have admin role ────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
