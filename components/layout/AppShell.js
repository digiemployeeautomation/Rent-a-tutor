'use client'
import { usePathname } from 'next/navigation'
import BottomTabs from '@/components/layout/BottomTabs'
import Navbar from '@/components/layout/Navbar'

export default function AppShell({ children }) {
  const pathname = usePathname()

  const bare =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/demo')

  if (bare) return <>{children}</>

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] pb-24 md:pb-0">
        {children}
      </main>
      <BottomTabs />
    </>
  )
}
