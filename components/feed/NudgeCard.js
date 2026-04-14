'use client'

import Link from 'next/link'
import FeedCard from './FeedCard'

export default function NudgeCard({ onDismiss, delay = 0 }) {
  return (
    <FeedCard delay={delay} className="bg-blue-50 border-blue-100">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-800">Complete your profile</p>
          <p className="text-xs text-blue-600 mt-0.5 leading-snug">
            Finish setting up your profile to get personalised subject recommendations.
          </p>
          <Link
            href="/dashboard/student/onboarding"
            className="inline-block mt-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Complete profile
          </Link>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </FeedCard>
  )
}
