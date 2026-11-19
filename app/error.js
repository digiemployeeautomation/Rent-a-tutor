// app/error.js
'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw } from 'lucide-react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="container-app pb-20 pt-10 sm:pt-16">
      <div className="max-w-2xl animate-fade-in-up" role="alert">
        <h1 className="h-display border-b-2 border-ink-900 pb-5 sm:pb-7">Something went <mark className="hl">wrong.</mark></h1>
        <p className="lead mt-6">
          This page did not load properly. Please try again. If you are offline, your saved lessons are still in{' '}
          <Link href="/downloads" className="link">Downloads</Link>.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="button" onClick={reset} className="btn-primary btn-lg">
            <RotateCcw className="h-5 w-5" aria-hidden="true" /> Try again
          </button>
          <Link href="/" className="link inline-flex min-h-[44px] items-center">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
