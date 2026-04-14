'use client'

import Link from 'next/link'
import FeedCard from './FeedCard'

export default function QuizResultCard({ quizName, score = 0, maxScore = 0, passed = false, href, delay = 0 }) {
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  return (
    <FeedCard delay={delay} onClick={href ? undefined : undefined}>
      <Link href={href} className="flex items-center gap-4">
        {/* Pass/fail icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
          {passed ? (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{quizName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {score}/{maxScore} &middot; {percentage}%
          </p>
        </div>

        <div className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {passed ? 'Passed' : 'Failed'}
        </div>
      </Link>
    </FeedCard>
  )
}
