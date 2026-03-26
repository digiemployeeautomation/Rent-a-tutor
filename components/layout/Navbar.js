'use client'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar({ user }) {
  const { role } = useTheme()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : role === 'tutor' ? 'TU' : 'ST'

  return (
    <nav style={{ backgroundColor: 'var(--color-nav-bg)' }} className="px-6 h-16 flex items-center justify-between">
      <Link href="/" className="font-serif text-xl" style={{ color: 'var(--color-nav-text)' }}>
        Rent a <span style={{ color: 'var(--color-nav-accent)' }} className="italic">Tutor</span>
      </Link>

      <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--color-nav-text)', opacity: 0.8 }}>
        {role === 'tutor' ? (
          <>
            <Link href="/dashboard/tutor" className="hover:opacity-100">Dashboard</Link>
            <Link href="/dashboard/tutor/upload" className="hover:opacity-100">Upload lesson</Link>
            <Link href="/dashboard/tutor/sessions" className="hover:opacity-100">Sessions</Link>
          </>
        ) : (
          <>
            <Link href="/browse" className="hover:opacity-100">Browse lessons</Link>
            <Link href="/tutor" className="hover:opacity-100">Find a tutor</Link>
            <Link href="/exam-prep" className="hover:opacity-100">Exam prep</Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium" style={{ color: 'var(--color-nav-text)' }}>
                {user.full_name || 'My account'}
              </div>
              <div className="text-xs capitalize" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>
                {role}
              </div>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2"
              style={{
                backgroundColor: 'var(--color-primary-mid)',
                color: 'var(--color-nav-text)',
                borderColor: 'rgba(255,255,255,0.15)'
              }}
            >
              {initials}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ color: 'var(--color-nav-text)', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="text-sm px-4 py-2 rounded-lg border"
              style={{ color: 'var(--color-nav-text)', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
