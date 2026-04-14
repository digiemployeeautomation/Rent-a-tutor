'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard/student', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { href: '/learn', label: 'Learn', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '/dashboard/student/leaderboard', label: 'Rank', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { href: '/dashboard/student/settings', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

export default function BottomTabs() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {TABS.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard/student' && pathname.startsWith(tab.href))
          return (
            <Link key={tab.href} href={tab.href} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className={`text-[10px] font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
