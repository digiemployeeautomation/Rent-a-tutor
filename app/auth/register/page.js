'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [formLevel, setFormLevel]   = useState(1)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

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

    const { error: profileError } = await supabase
      .from('student_profiles')
      .insert({
        user_id: data.user.id,
        display_name: name,
        form_level: formLevel,
        learning_tier: 'balanced',
        onboarding_complete: false,
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <div className="w-full max-w-sm">

        <Link href="/" className="block text-center font-serif text-2xl mb-8" style={{ color: 'var(--color-primary)' }}>
          Rent a <span style={{ color: 'var(--color-accent)' }} className="italic">Tutor</span>
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h1 className="font-serif text-xl mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Start your learning journey</p>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            <div>
              <label className="block text-sm text-gray-600 mb-1">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Form level</label>
              <select
                required
                value={formLevel}
                onChange={e => setFormLevel(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white"
              >
                <option value={1}>Form 1</option>
                <option value={2}>Form 2</option>
                <option value={3}>Form 3</option>
                <option value={4}>Form 4</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="hover:underline" style={{ color: 'var(--color-primary-lit)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
