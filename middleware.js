import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

// Routes that require a logged-in user
const PROTECTED_ROUTES = ['/dashboard', '/messages', '/bookings']

// Routes only admins can access
const ADMIN_ROUTES = ['/admin']

export async function middleware(request) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // Refresh the session cookie on every request
  const supabase = createMiddlewareClient({ req: request, res: response })
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  const isAdmin     = ADMIN_ROUTES.some((r) => pathname.startsWith(r))

  // Not logged in → redirect to login
  if ((isProtected || isAdmin) && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in but not admin → redirect home
  if (isAdmin && user) {
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
