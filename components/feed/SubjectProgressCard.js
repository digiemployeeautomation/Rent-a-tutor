'use client'

import Link from 'next/link'
import FeedCard from './FeedCard'

export default function SubjectProgressCard({ name, percentComplete = 0, href, delay = 0 }) {
  const percent = Math.round(percentComplete)
  const isNearDone = percent > 80

  // SVG circle math
  const radius = 15.9155
  const circumference = 2 * Math.PI * radius
  const dashArray = `${(percent / 100) * circumference} ${circumference}`

  return (
    <FeedCard delay={delay} onClick={undefined}>
      <Link href={href} className="flex flex-col items-center gap-3">
        {/* Circular progress ring */}
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {/* Background track */}
            <circle
              cx="18" cy="18" r="15.9155"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            {/* Progress arc */}
            <circle
              cx="18" cy="18" r="15.9155"
              fill="none"
              stroke={isNearDone ? '#ec4899' : '#3b82f6'}
              strokeWidth="3"
              strokeDasharray={dashArray}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-700">{percent}%</span>
          </div>
        </div>

        <span className="text-xs text-center text-gray-600 leading-tight max-w-[80px] truncate font-medium">
          {name}
        </span>
      </Link>
    </FeedCard>
  )
}
