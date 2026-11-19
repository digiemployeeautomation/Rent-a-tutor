'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { APP_NAV, isActive } from '@/components/layout/nav-config'

// Mobile tab bar — only for signed-in students.
export default function BottomTabs() {
  const pathname = usePathname()
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setAuthed(!!session))
    return () => subscription.unsubscribe()
  }, [])

  if (!authed) return null

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="Main">
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-1">
        {APP_NAV.map((tab) => {
          const active = isActive(pathname, tab)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors ${active ? 'text-blue-700' : 'text-ink-400'}`}
            >
              <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? 'bg-blue-50' : ''}`}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
              </span>
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
