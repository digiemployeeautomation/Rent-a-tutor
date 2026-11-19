// app/error.js
'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw, TriangleAlert } from 'lucide-react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-md text-center animate-fade-in-up" role="alert">
        <span className="icon-tile mx-auto h-16 w-16 rounded-2xl bg-sun-100 text-sun-600">
          <TriangleAlert className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="h-page mt-6">Something went wrong</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
          This page did not load properly. Please try again. If you are offline, your saved lessons are still in Downloads.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="btn-primary">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
          <Link href="/" className="btn-secondary">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
