// app/not-found.js
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <div className="w-full max-w-md text-center">

        <Link href="/" className="block font-serif text-2xl mb-10"
          style={{ color: 'var(--color-primary)' }}>
          Rent a <span style={{ color: 'var(--color-accent)' }} className="italic">Tutor</span>
        </Link>

        <div className="font-serif mb-4" style={{ fontSize: 72, color: 'var(--color-surface-mid)', lineHeight: 1 }}>
          404
        </div>

        <h1 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-primary)' }}>
          Page not found
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/"
            className="text-sm px-6 py-2.5 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
            Back to home
          </Link>
          <Link href="/browse"
            className="text-sm px-6 py-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            Browse lessons
          </Link>
        </div>
      </div>
    </div>
  )
}
