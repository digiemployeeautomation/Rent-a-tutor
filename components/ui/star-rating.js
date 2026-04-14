'use client'

export function StarRating({ rating = 0, max = 5, size = 14, className = '' }) {
  const stars = []
  const rounded = Math.round(rating * 2) / 2

  for (let i = 1; i <= max; i++) {
    const fill = rounded >= i ? 'full' : rounded >= i - 0.5 ? 'half' : 'empty'
    stars.push(
      <svg key={i} width={size} height={size} viewBox="0 0 20 20" className="flex-shrink-0">
        <defs>
          <linearGradient id={`half-${i}-${size}`}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27 5.06 16.7 6 11.21l-4-3.9 5.53-.8L10 1.5z"
          fill={fill === 'full' ? 'currentColor' : fill === 'half' ? `url(#half-${i}-${size})` : 'transparent'}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} out of ${max} stars`}>
      {stars}
    </span>
  )
}
