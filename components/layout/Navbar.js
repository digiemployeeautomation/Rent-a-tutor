'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ProfileDropdown from './ProfileDropdown'

export default function Navbar() {
  const { role }  = useTheme()
  const router    = useRouter()
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
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
      {/* Logo — hidden on desktop when sidebar is visible */}
      <Link href="/" className="nav-brand font-serif text-xl lg:hidden" style={{ color: 'var(--color-nav-text)' }}>
        Rent a{' '}
        <span style={{ color: 'var(--color-nav-accent)' }} className="italic">Tutor</span>
      </Link>
      {/* Spacer on desktop so right-side items stay right-aligned */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {loading ? (
          <div
            className="animate-pulse rounded-lg"
            style={{ width: 80, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' }}
          />
        ) : user ? (
          <ProfileDropdown
            user={user}
            profile={profile}
            onLogout={handleLogout}
          />
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
