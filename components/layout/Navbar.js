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
    <header className="no-print sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Brand href={user ? '/dashboard/student' : '/'} />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => {
            const active = isActive(pathname, link)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
                }`}
              >
                {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          {!ready ? (
            <div className="h-9 w-24 animate-pulse rounded-xl bg-ink-100" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-white ring-2 ring-white transition hover:bg-ink-700"
              >
                {initialOf(user)}
              </button>
              {menuOpen ? (
                <div role="menu" className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lift">
                  <div className="border-b border-ink-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink-900">{user.user_metadata?.full_name || 'Student'}</p>
                    <p className="truncate text-xs text-ink-400">{user.user_metadata?.is_demo ? 'Demo account' : user.email}</p>
                  </div>
                  <button type="button" role="menuitem" onClick={signOut} className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-ink-700 hover:bg-ink-50">
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost btn-sm hidden sm:inline-flex">Log in</Link>
              <Link href="/demo" className="btn-primary btn-sm">Try the demo</Link>
              <button type="button" className="btn-ghost btn-sm !px-2 md:hidden" aria-label="Menu" onClick={() => setMobileOpen((v) => !v)}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {!user && mobileOpen ? (
        <nav className="border-t border-ink-100 bg-white px-4 py-3 md:hidden" aria-label="Mobile">
          {PUBLIC_NAV.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-xl px-3 py-3 text-[15px] font-medium text-ink-700 hover:bg-ink-50">{l.label}</Link>
          ))}
          <Link href="/auth/login" className="block rounded-xl px-3 py-3 text-[15px] font-medium text-ink-700 hover:bg-ink-50">Log in</Link>
        </nav>
      ) : null}
    </header>
  )
}
