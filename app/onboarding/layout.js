import Link from 'next/link'
import Brand from '@/components/layout/Brand'

export const metadata = { title: 'Set your IELTS goal' }

export default function OnboardingLayout({ children }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink-200">
        <div className="container-read flex h-[60px] max-w-[640px] items-center justify-between">
          <Brand href="/dashboard/student" />
          <Link href="/dashboard/student" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-ink-500 hover:text-ink-900">
            Skip for now
          </Link>
        </div>
      </header>
      <main className="container-read max-w-[640px] pb-16 pt-8 sm:pt-12">
        {children}
      </main>
    </div>
  )
}
