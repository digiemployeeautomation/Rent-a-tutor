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
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Main">
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around">
        {APP_NAV.map((tab) => {
          const active = isActive(pathname, tab)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? 'text-board-800' : 'text-ink-500'}`}
            >
              <span className={`absolute inset-x-5 top-[-1px] h-[3px] rounded-b-sm bg-board-700 transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
