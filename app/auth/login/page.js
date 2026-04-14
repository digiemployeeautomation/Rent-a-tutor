'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

// Ensures the redirectTo path actually belongs to the role that just logged in.
// Prevents a student from being sent to an unauthorized path via a crafted URL.
function getSafeRedirect(redirectTo, role) {
  if (!redirectTo) return null
  // Allow role-specific dashboard redirects
  if (role === 'student' && redirectTo.startsWith('/dashboard/student')) return redirectTo
  if (role === 'admin'   && redirectTo.startsWith('/admin'))             return redirectTo
  // Allow student onboarding and learning paths
  if (role === 'student' && (redirectTo.startsWith('/learn') || redirectTo.startsWith('/onboarding'))) {
    return redirectTo
  }
  // Allow redirects to public pages (browse, tutor profiles, etc.)
  if (redirectTo.startsWith('/browse/') || redirectTo.startsWith('/tutor/') || redirectTo.startsWith('/about')) {
    return redirectTo
  }
  return null
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = profile?.role ?? data.user.user_metadata?.role ?? 'student'

    // Admins always go to the separate admin console — never use redirectTo
    if (role === 'admin') {
      window.location.href = 'https://admin.rentatutor.co.zm'
      return
    }

    // For students, check onboarding completion before redirecting
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('onboarding_complete')
      .eq('user_id', data.user.id)
      .single()

    if (!studentProfile || !studentProfile.onboarding_complete) {
      return router.push('/onboarding')
    }

    // Only honour redirectTo if it matches the user's actual role
    const safeDest = getSafeRedirect(redirectTo, role)
    if (safeDest) return router.push(safeDest)

    return router.push('/dashboard/student')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-serif text-2xl text-forest-600 mb-8">
          Rent a <span className="text-gold-500 italic">Tutor</span>
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h1 className="font-serif text-xl mb-6">Welcome back</h1>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-forest-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-forest-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-600 text-sage-200 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-700 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-forest-500 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <LoginForm />
    </Suspense>
  )
}
