'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ADMIN_URL = 'https://admin.rentatutor.co.zm'

export default function Navbar() {
  const { role } = useTheme()
  const router = useRouter()
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const fullName  = profile?.full_name ?? user?.user_metadata?.full_name ?? null
  const avatarUrl = profile?.avatar_url ?? null
  const initials  = fullName
    ? fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <nav style={{ backgroundColor: 'var(--color-nav-bg)' }} className="px-6 h-16 flex items-center justify-between">
      <Link href="/" className="font-serif text-xl" style={{ color: 'var(--color-nav-text)' }}>
        Rent a <span style={{ color: 'var(--color-nav-accent)' }} className="italic">Tutor</span>
      </Link>

      <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--color-nav-text)', opacity: 0.8 }}>
        {role === 'tutor' ? (
          <>
            <Link href="/dashboard/tutor"          className="hover:opacity-100">Dashboard</Link>
            <Link href="/dashboard/tutor/upload"   className="hover:opacity-100">Upload lesson</Link>
            <Link href="/dashboard/tutor/sessions" className="hover:opacity-100">Sessions</Link>
          </>
        ) : role === 'admin' ? (
          <>
            <a href={ADMIN_URL}               className="hover:opacity-100">Dashboard</a>
            <a href={`${ADMIN_URL}/users`}    className="hover:opacity-100">Users</a>
            <a href={`${ADMIN_URL}/payments`} className="hover:opacity-100">Payments</a>
          </>
        ) : (
          <>
            <Link href="/browse"    className="hover:opacity-100">Browse lessons</Link>
            <Link href="/tutor"     className="hover:opacity-100">Find a tutor</Link>
            <Link href="/exam-prep" className="hover:opacity-100">Exam prep</Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {loading ? (
          <div className="w-20 h-8 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
        ) : user ? (
          <>
            <div className="text-right hidden sm:block">
              {/* Full white, full opacity — no more faded name */}
              <div className="text-xs font-semibold" style={{ color: '#ffffff' }}>
                {fullName || 'My account'}
              </div>
              <div className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {profile?.role ?? role}
              </div>
            </div>

            {avatarUrl ? (
              <div className="w-9 h-9 rounded-full overflow-hidden border-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <Image
                  src={avatarUrl}
                  alt={fullName ?? 'Profile'}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2"
                style={{
                  backgroundColor: 'var(--color-primary-mid)',
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.15)',
                }}
              >
                {initials}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
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
