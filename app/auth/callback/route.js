import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      const role = data.user.user_metadata?.role || 'student'

      // Redirect to the correct dashboard based on role
      if (role === 'tutor') {
        return NextResponse.redirect(new URL('/dashboard/tutor', requestUrl.origin))
      } else {
        return NextResponse.redirect(new URL('/dashboard/student', requestUrl.origin))
      }
    }
  }

  // If something went wrong, send to login with an error message
  return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', requestUrl.origin))
}
