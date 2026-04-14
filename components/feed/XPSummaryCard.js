'use client'

import FeedCard from './FeedCard'
import CountUp from '@/components/ui/CountUp'

export default function XPSummaryCard({ xpToday = 0, level = 1, xpToNextLevel = 0, xpProgress = 0 }) {
  return (
    <FeedCard delay={100}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">XP Today</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            Level {level}
          </span>
        </div>

        <div className="text-3xl font-bold text-blue-600">
          +<CountUp target={xpToday} duration={900} />
        </div>

        {/* Progress to next level */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">To next level</span>
            <span className="text-xs font-medium text-blue-600">{xpToNextLevel} XP</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, xpProgress)}%` }}
            />
          </div>
        </div>
      </div>
    </FeedCard>
  )
}
