'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthShell, { FormError } from '@/components/marketing/AuthShell'

// Only send new students on to their own learning pages.
function safeNext(path) {
  if (!path) return null
  if (path.startsWith('/dashboard/student') || path.startsWith('/learn') || path.startsWith('/practice')) return path
  return null
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('redirectTo') || searchParams.get('next'))

  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const name = fullName.trim()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: 'student' },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // With email confirmation on, Supabase returns no session yet.
    if (data?.session) {
      router.replace(next || '/dashboard/student')
      router.refresh()
    } else {
      router.replace(`/auth/pending?email=${encodeURIComponent(email)}`)
    }
  }

  const loginHref = next ? `/auth/login?redirectTo=${encodeURIComponent(next)}` : '/auth/login'

  return (
    <AuthShell
      title="Create your free account"
      subtitle="Save your progress across High School lessons and IELTS practice."
      footer={
        <p className="text-center text-sm text-ink-500">
          Just want to look around?{' '}
          <Link href="/demo" className="font-semibold text-blue-700 hover:underline">Try the demo — no sign-up</Link>
        </p>
      }
    >
      <FormError>{error}</FormError>

      <form onSubmit={handleRegister} className="mt-6 space-y-4">
        <div>
          <label htmlFor="fullName" className="label">Full name</label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="field"
            placeholder="Your full name"
          />
        </div>

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
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="field"
            placeholder="At least 6 characters"
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="muted mt-1.5">Use 6 or more characters.</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Creating account…</> : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link href={loginHref} className="font-semibold text-blue-700 hover:underline">Log in</Link>
      </p>
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <RegisterForm />
    </Suspense>
  )
}
