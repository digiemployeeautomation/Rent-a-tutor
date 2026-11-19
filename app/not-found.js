// app/not-found.js
import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <span className="icon-tile mx-auto h-16 w-16 rounded-2xl bg-blue-50 text-blue-600">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-semibold text-ink-400">Error 404</p>
        <h1 className="h-page mt-1">We could not find that page</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
          The link may be old or mistyped. Try one of these instead.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/learn/high-school" className="btn-primary">Browse lessons</Link>
          <Link href="/" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
