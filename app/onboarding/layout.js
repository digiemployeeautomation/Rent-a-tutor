import Link from 'next/link'
import Brand from '@/components/layout/Brand'

export const metadata = { title: 'Set your IELTS goal' }

export default function OnboardingLayout({ children }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink-100 bg-white">
        <div className="container-read flex h-16 items-center justify-between">
          <Brand href="/dashboard/student" />
          <Link href="/dashboard/student" className="inline-flex min-h-[44px] items-center px-2 text-sm font-semibold text-ink-500 hover:text-ink-900">
            Skip for now
          </Link>
        </div>
      </header>
      <main className="container-read max-w-xl py-8 sm:py-14">
        <p className="eyebrow mb-6 text-teal-700">IELTS goal</p>
        {children}
      </main>
    </div>
  )
}
