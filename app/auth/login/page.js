'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, PlayCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthShell, { FormError } from '@/components/marketing/AuthShell'

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

function friendlyError(message) {
  if (/invalid login credentials/i.test(message)) return 'That email and password do not match. Check them and try again.'
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first — we sent you a link when you signed up.'
  return message
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || searchParams.get('next')

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
      setError(friendlyError(error.message))
      setLoading(false)
      return
    }

    // Role check is best-effort; failures fall through to the student path.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    const role = profile?.role ?? data.user.user_metadata?.role ?? 'student'

    if (role === 'admin') {
      window.location.href = 'https://admin.rentatutor.co.zm'
      return
    }

    // Onboarding gate: students without an IELTS profile go to /onboarding.
    const { data: ieltsProfile } = await supabase
      .from('user_ielts_profile')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (!ieltsProfile) {
      return router.push('/onboarding')
    }

    const safeDest = getSafeRedirect(redirectTo, role)
    if (safeDest) return router.push(safeDest)

    return router.push('/dashboard/student')
  }

  const registerHref = redirectTo ? `/auth/register?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/register'

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to carry on where you left off."
      footer={
        <Link
          href="/demo"
          className="group flex items-center gap-4 rounded-2xl border border-sun-200 bg-sun-50 p-4 transition-colors hover:border-sun-300 hover:bg-sun-100"
        >
          <span className="icon-tile bg-sun-400 text-ink-900"><PlayCircle className="h-5 w-5" aria-hidden="true" /></span>
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ink-900">Just exploring? Try the demo</span>
            <span className="block text-sm text-ink-500">No sign-up — opens a ready-made student account.</span>
          </span>
          <ArrowRight className="h-5 w-5 text-ink-500 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      }
    >
      <FormError>{error}</FormError>

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="field"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="field"
            placeholder="Your password"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Logging in…</> : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        New here?{' '}
        <Link href={registerHref} className="font-semibold text-blue-700 hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <LoginForm />
    </Suspense>
  )
}
