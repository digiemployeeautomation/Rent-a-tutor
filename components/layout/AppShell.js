'use client'
import { usePathname } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import BottomTabs from '@/components/layout/BottomTabs'
import Navbar from '@/components/layout/Navbar'

export default function AppShell({ children }) {
  const pathname = usePathname()

  const isLesson = pathname.includes('/lesson/')
  const isAdmin = pathname.startsWith('/admin')
  const isAuth = pathname.startsWith('/auth')
  const isOnboarding = pathname.startsWith('/onboarding')

  if (isLesson || isAdmin || isAuth || isOnboarding) {
    return <>{children}</>
  }

  return (
    <>
      <div className="md:hidden"><TopBar /></div>
      <div className="hidden md:block"><Navbar /></div>
      <main className="min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <BottomTabs />
    </>
  )
}
