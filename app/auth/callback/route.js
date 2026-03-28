import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Read role from profiles table — source of truth
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = profile?.role ?? data.user.user_metadata?.role ?? 'student'

      if (role === 'admin')   return NextResponse.redirect(new URL('/admin', requestUrl.origin))
      if (role === 'tutor')   return NextResponse.redirect(new URL('/dashboard/tutor', requestUrl.origin))
      return NextResponse.redirect(new URL('/dashboard/student', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', requestUrl.origin))
}
