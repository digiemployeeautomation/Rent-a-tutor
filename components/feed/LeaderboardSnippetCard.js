'use client'

import Link from 'next/link'
import FeedCard from './FeedCard'

function rankBadge(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default function LeaderboardSnippetCard({ rank = null, topThree = [], delay = 0 }) {
  const entries = topThree.slice(0, 3)

  return (
    <FeedCard delay={delay}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Leaderboard</h3>
        {rank && (
          <span className="text-xs text-gray-500">
            Your rank: <span className="font-medium text-blue-600">#{rank}</span>
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-gray-400 py-2 text-center">No leaderboard data yet.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {entries.map((entry) => (
            <div key={entry.rank} className="flex items-center gap-3">
              <span className="text-base w-6 text-center flex-shrink-0">{rankBadge(entry.rank)}</span>
              <span className="flex-1 text-sm text-gray-700 font-medium truncate">{entry.displayName}</span>
              <span className="text-xs text-gray-500 flex-shrink-0">{(entry.xpTotal ?? 0).toLocaleString()} XP</span>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/student/leaderboard"
        className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
      >
        View full leaderboard →
      </Link>
    </FeedCard>
  )
}
