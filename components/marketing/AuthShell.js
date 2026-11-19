// Layout for sign-in / sign-up / status pages (no navbar).
// Desktop: the form on paper at the left, the chalkboard at the right.
// Phones: just the form.
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Brand from '@/components/layout/Brand'
import ChalkDoodles from '@/components/art/ChalkDoodles'

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
  boardLine = 'One clear step at a time.',
  boardNote = 'Free lessons for Forms 1 to 4 and IELTS.',
  doodles = 'maths',
}) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)]">
      <div className="flex min-h-screen flex-col">
        <header className="flex h-[60px] shrink-0 items-center justify-between px-5 sm:px-8 lg:px-10">
          <Brand />
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Home
          </Link>
        </header>
        <main className="flex flex-1 items-start px-5 pb-16 pt-8 sm:px-8 sm:pt-14 lg:items-center lg:px-10 lg:pb-16 lg:pt-8">
          <div className={`mx-auto w-full animate-fade-in-up ${wide ? 'max-w-lg' : 'max-w-[420px]'}`}>
            {title ? <h1 className="h-page">{title}</h1> : null}
            {subtitle ? <p className="mt-2.5 text-[17px] leading-[1.5] text-ink-600">{subtitle}</p> : null}
            {children}
            {footer ? <div className="mt-8 border-t border-ink-200 pt-6">{footer}</div> : null}
          </div>
        </main>
      </div>

      <aside className="hidden p-4 pl-0 lg:block" aria-hidden="true">
        <div className="board sticky top-4 flex h-[calc(100vh-2rem)] min-h-[520px] flex-col justify-end p-10 xl:p-14">
          <ChalkDoodles variant={doodles} opacity={0.22} className="!right-[5%] !top-[30%] !h-auto !max-h-none !w-[90%]" />
          <p className="max-w-[12ch] font-display text-[2.5rem] font-semibold leading-[1.05] text-chalk xl:text-[3rem]" style={{ letterSpacing: '-0.025em' }}>
            {boardLine}
          </p>
          <p className="board-soft mt-4 max-w-[34ch] text-[17px] leading-snug">{boardNote}</p>
        </div>
      </aside>
    </div>
  )
}

export function FormError({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[15px] font-semibold leading-snug text-rose-800">
      {children}
    </div>
  )
}

// The way in for visitors who do not want an account yet.
export function DemoRoute() {
  return (
    <div>
      <p className="text-[15px] font-bold text-ink-900">Just looking around?</p>
      <p className="mt-0.5 text-[15px] leading-snug text-ink-600">The demo opens a ready-made student account. No forms and no email.</p>
      <Link href="/demo" className="btn-secondary group mt-4 w-full">
        Try the demo without signing up <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
