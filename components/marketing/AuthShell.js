// Centred card layout for sign-in / sign-up / status pages (no navbar).
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Brand from '@/components/layout/Brand'

export default function AuthShell({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="container-app flex h-16 items-center justify-between">
        <Brand />
        <Link href="/" className="btn-ghost btn-sm">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Home
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className={`w-full animate-fade-in-up ${wide ? 'max-w-lg' : 'max-w-md'}`}>
          <div className="card p-6 sm:p-8">
            {title ? <h1 className="h-page">{title}</h1> : null}
            {subtitle ? <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{subtitle}</p> : null}
            {children}
          </div>
          {footer ? <div className="mt-5">{footer}</div> : null}
        </div>
      </main>
    </div>
  )
}

export function FormError({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {children}
    </div>
  )
}
