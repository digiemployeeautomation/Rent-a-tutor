'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { role } = useTheme()
  const router = useRouter()
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [scrolled, setScrolled] = useState(false)

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', userId)
        .single()
      if (error) console.error('[Navbar] profile fetch error:', error.message)
      else setProfile(data)
    } catch (err) {
      console.error('[Navbar] profile fetch failed:', err)
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) await fetchProfile(user.id)
      } catch (err) {
        console.error('[Navbar] auth error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      else setProfile(null)
    })

    const handleScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const fullName  = profile?.full_name ?? user?.user_metadata?.full_name ?? null
  const avatarUrl = profile?.avatar_url ?? null
  const initials  = fullName
    ? fullName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <nav
      aria-label="Main navigation"
      style={{
        backgroundColor: 'var(--color-nav-bg)',
        boxShadow: scrolled
          ? '0 2px 12px rgba(0,0,0,0.18)'
          : '0 1px 0 rgba(255,255,255,0.06)',
        transition: 'box-shadow 250ms ease',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
      className="px-6 h-16 flex items-center justify-between"
    >
      <Link
        href="/"
        className="nav-brand font-serif text-xl"
        style={{ color: 'var(--color-nav-text)' }}
      >
        Rent a{' '}
        <span style={{ color: 'var(--color-nav-accent)' }} className="italic">
          Tutor
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {loading ? (
          <div
            className="animate-pulse rounded-lg"
            style={{ width: 80, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' }}
          />
        ) : user ? (
          <>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold" style={{ color: '#ffffff' }}>
                {fullName || 'My account'}
              </div>
              <div className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {profile?.role ?? role}
              </div>
            </div>

            {avatarUrl ? (
              <div
                className="rounded-full overflow-hidden flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  border: '2px solid rgba(255,255,255,0.20)',
                  transition: 'border-color 200ms ease, box-shadow 200ms ease',
                }}
              >
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
                className="rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: 'var(--color-primary-mid)',
                  color: '#ffffff',
                  border: '2px solid rgba(255,255,255,0.15)',
                  transition: 'box-shadow 200ms ease',
                  letterSpacing: '0.05em',
                }}
              >
                {initials}
              </div>
            )}

            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="nav-logout text-xs px-3 py-1.5 rounded-lg"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="nav-login text-sm px-4 py-2 rounded-lg"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="nav-cta text-sm px-4 py-2 rounded-lg font-medium"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
