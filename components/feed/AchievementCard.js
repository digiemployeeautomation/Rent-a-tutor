'use client'

import FeedCard from './FeedCard'

export default function AchievementCard({ name, description, icon, delay = 0 }) {
  return (
    <FeedCard delay={delay} className="bg-pink-50 border-pink-100">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-pink-100 flex items-center justify-center text-2xl flex-shrink-0">
          {icon ?? '🏆'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>
        </div>
        <div className="flex-shrink-0">
          <span className="text-lg">🎉</span>
        </div>
      </div>
    </FeedCard>
  )
}
