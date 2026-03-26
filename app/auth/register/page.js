'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState('student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (role === 'tutor') {
      router.push('/dashboard/tutor')
    } else {
      router.push('/dashboard/student')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-serif text-2xl text-forest-600 mb-8">
          Rent a <span className="text-gold-500 italic">Tutor</span>
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h1 className="font-serif text-xl mb-2">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Free to join — no subscription required.</p>

          {/* Role toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
            {['student', 'tutor'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                  role === r
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
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
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-forest-500"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-forest-500"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-forest-500"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-600 text-sage-200 py-2.5 rounded-lg text-sm font-medium hover:bg-forest-700 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : `Sign up as ${role}`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-forest-500 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
