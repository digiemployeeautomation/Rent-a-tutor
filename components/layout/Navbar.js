'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Brand from '@/components/layout/Brand'
import { APP_NAV, PUBLIC_NAV, isActive } from '@/components/layout/nav-config'

function initialOf(user) {
  const name = user?.user_metadata?.full_name || user?.email || ''
  return name.trim()[0]?.toUpperCase() || 'S'
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { setUser(user ?? null); setReady(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null); setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { setMenuOpen(false); setMobileOpen(false) }, [pathname])

  useEffect(() => {
    function onDown(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links = user ? APP_NAV : PUBLIC_NAV

  return (
    <header className="no-print sticky top-0 z-40 border-b border-ink-200 bg-paper">
      <div className="container-app flex h-[60px] items-center gap-8">
        <Brand href={user ? '/dashboard/student' : '/'} />

        <nav className="hidden h-full items-stretch gap-7 md:flex" aria-label="Main">
          {links.map((link) => {
            const active = isActive(pathname, link)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`relative inline-flex items-center text-[15px] font-semibold ${active ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'}`}
              >
                {link.label}
                <span className={`absolute inset-x-0 -bottom-px h-[3px] rounded-t-sm bg-board-700 transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!ready ? (
            <div className="h-9 w-24 rounded-md bg-ink-100" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-300 bg-white font-display text-[15px] font-semibold text-ink-900 hover:border-ink-900"
              >
                {initialOf(user)}
              </button>
              {menuOpen ? (
                <div role="menu" className="absolute right-0 mt-2 w-60 animate-fade-in overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
                  <div className="border-b border-ink-200 px-4 py-3">
                    <p className="truncate text-sm font-bold text-ink-900">{user.user_metadata?.full_name || 'Student'}</p>
                    <p className="truncate text-[13px] text-ink-500">{user.user_metadata?.is_demo ? 'Demo account' : user.email}</p>
                  </div>
                  <button type="button" role="menuitem" onClick={signOut} className="flex min-h-[44px] w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-ink-700 hover:bg-ink-50 hover:text-ink-900">
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost btn-sm hidden sm:inline-flex">Log in</Link>
              <Link href="/demo" className="btn-primary btn-sm">Try the demo</Link>
              <button type="button" className="btn-ghost btn-sm !px-2 md:hidden" aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((v) => !v)}>
                {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </button>
            </>
          )}
        </div>
      </div>

      {!user && mobileOpen ? (
        <nav className="border-t border-ink-200 bg-paper px-5 py-2 md:hidden" aria-label="Mobile">
          <div className="divide-y divide-ink-200">
            {PUBLIC_NAV.map((l) => (
              <Link key={l.href} href={l.href} className="flex min-h-[48px] items-center text-base font-semibold text-ink-800">{l.label}</Link>
            ))}
            <Link href="/auth/login" className="flex min-h-[48px] items-center text-base font-semibold text-ink-800">Log in</Link>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
