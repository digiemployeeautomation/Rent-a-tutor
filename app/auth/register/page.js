'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ALLOWED_ROLES = ['student', 'tutor']

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole]           = useState('student')
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [otherNames, setOtherNames] = useState('')
  const [fullName, setFullName]     = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!ALLOWED_ROLES.includes(role)) {
      setError('Invalid role selected.')
      setLoading(false)
      return
    }

    const name = role === 'tutor'
      ? [firstName.trim(), otherNames.trim(), lastName.trim()].filter(Boolean).join(' ')
      : fullName.trim()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/auth/verify')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <div className="w-full max-w-sm">

        <Link href="/" className="block text-center font-serif text-2xl mb-8" style={{ color: 'var(--color-primary)' }}>
          Rent a <span style={{ color: 'var(--color-accent)' }} className="italic">Tutor</span>
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h1 className="font-serif text-xl mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Free to join — no subscription required.</p>

          {/* Role toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
            {ALLOWED_ROLES.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="flex-1 py-2 rounded-md text-sm font-medium transition"
                style={role === r ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-nav-text)'
                } : {
                  color: '#6b7280'
                }}
              >
                {r === 'student' ? 'I am a student' : 'I am a tutor'}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Tutor: two separate name fields */}
            {role === 'tutor' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">First name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Last name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400"
                      placeholder="Banda"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Other names <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={otherNames}
                    onChange={e => setOtherNames(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400"
                    placeholder="Middle name or initials"
                  />
                </div>
              </>
            ) : (
              /* Student: single full name field */
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
            )}

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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
            >
              {loading ? 'Creating account...' : `Sign up as ${role}`}
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
