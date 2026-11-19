// app/not-found.js
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container-app pb-20 pt-10 sm:pt-16">
      <div className="max-w-2xl animate-fade-in-up">
        <p className="numeral border-b-2 border-ink-900 pb-3 text-[6.5rem] leading-[0.9] text-copper-600 sm:text-[10rem]">
          <span className="sr-only">Error </span>404
        </p>
        <h1 className="h-page mt-6">We could not find that page.</h1>
        <p className="lead mt-3">
          The link may be old or mistyped. The lessons are still where they were.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/learn/high-school" className="btn-primary btn-lg group">
            Browse lessons <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
          </Link>
          <Link href="/" className="link inline-flex min-h-[44px] items-center">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
