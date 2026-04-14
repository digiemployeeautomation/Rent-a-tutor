'use client'

import Link from 'next/link'
import FeedCard from './FeedCard'

export default function ContinueLearningCard({ lessonTitle, subjectName, progress = 0, href }) {
  return (
    <FeedCard delay={0}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 mb-2">
            {subjectName}
          </span>
          <h3 className="text-base font-semibold text-gray-900 leading-snug truncate">
            {lessonTitle}
          </h3>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-medium text-blue-600">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Link
        href={href}
        className="inline-block text-sm font-medium px-5 py-2.5 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-colors"
      >
        Continue →
      </Link>
    </FeedCard>
  )
}
