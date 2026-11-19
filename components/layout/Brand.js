import Link from 'next/link'

// The mark: a teacher's tick on a chalkboard-green tile, with a copper full stop.
export function BrandMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect width="36" height="36" rx="8" fill="#0F5337" />
      <path d="M9.5 19.5 15.5 25.5 26.5 10.5" fill="none" stroke="#F8F7EE" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26.5" cy="25.5" r="2.4" fill="#E78F56" />
    </svg>
  )
}

// Wordmark + mark. `tone="light"` for use on dark backgrounds.
export default function Brand({ href = '/', tone = 'dark', className = '' }) {
  const text = tone === 'light' ? 'text-chalk' : 'text-ink-900'
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Rent a Tutor home">
      <BrandMark />
      <span className={`font-display text-[19px] font-bold leading-none ${text}`} style={{ letterSpacing: '-0.03em' }}>
        Rent a Tutor
      </span>
    </Link>
  )
}
