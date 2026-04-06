// app/error.js
'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <div className="w-full max-w-md text-center">

        <Link href="/" className="block font-serif text-2xl mb-10"
          style={{ color: 'var(--color-primary)' }}>
          Rent a <span style={{ color: 'var(--color-accent)' }} className="italic">Tutor</span>
        </Link>

        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
          style={{ backgroundColor: 'var(--color-surface)' }}>
          ⚠
        </div>

        <h1 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-primary)' }}>
          Something went wrong
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          An unexpected error occurred. Please try again — if the problem persists,
          contact us at <span className="underline">hello@rentatutor.co.zm</span>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="text-sm px-6 py-2.5 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
            Try again
          </button>
          <Link href="/"
            className="text-sm px-6 py-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
