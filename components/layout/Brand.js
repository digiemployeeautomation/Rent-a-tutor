import Link from 'next/link'

// Wordmark + mark. `tone="light"` for use on dark backgrounds.
export default function Brand({ href = '/', tone = 'dark', className = '' }) {
  const text = tone === 'light' ? 'text-white' : 'text-ink-900'
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Rent a Tutor home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 6.5C4 5.67 4.67 5 5.5 5H10c1.1 0 2 .9 2 2v12c0-1.1-.9-2-2-2H5.5C4.67 17 4 16.33 4 15.5v-9Z" fill="#fff" />
          <path d="M20 6.5c0-.83-.67-1.5-1.5-1.5H14c-1.1 0-2 .9-2 2v12c0-1.1.9-2 2-2h4.5c.83 0 1.5-.67 1.5-1.5v-9Z" fill="#FBBF24" />
        </svg>
      </span>
      <span className={`font-display text-[19px] font-bold tracking-tight ${text}`}>
        Rent a Tutor
      </span>
    </Link>
  )
}
