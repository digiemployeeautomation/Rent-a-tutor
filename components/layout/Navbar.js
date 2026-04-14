'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const NAV_LINKS = [
  { href: '/dashboard/student', label: 'Home' },
  { href: '/learn', label: 'Learn' },
  { href: '/dashboard/student/leaderboard', label: 'Leaderboard' },
  { href: '/dashboard/student/settings', label: 'Settings' },
]

const PUBLIC_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  const links = user ? NAV_LINKS : PUBLIC_LINKS

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
        <Link href={user ? '/dashboard/student' : '/'} className="text-xl font-bold text-blue-600">
          Rent<span className="text-pink-400">a</span>Tutor
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(link => {
            const active = pathname === link.href || (link.href !== '/' && link.href !== '/dashboard/student' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <Link href="/dashboard/student/settings" className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
              {user.user_metadata?.full_name?.[0]?.toUpperCase() || '?'}
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Log in</Link>
              <Link href="/auth/register" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
