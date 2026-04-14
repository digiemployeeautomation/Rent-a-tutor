'use client'

import Link from 'next/link'

function rankBadge(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default function LeaderboardPreview({ leaderboard = [], currentRank = null }) {
  if (!leaderboard.length) {
    return (
      <div className="text-sm text-gray-400 py-4 text-center">
        Leaderboard data unavailable.
      </div>
    )
  }

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-medium text-gray-400 pb-2 w-10">Rank</th>
            <th className="text-left text-xs font-medium text-gray-400 pb-2">Name</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-2">XP</th>
            <th className="text-right text-xs font-medium text-gray-400 pb-2 pl-3">Lvl</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.rank === currentRank
            return (
              <tr
                key={entry.rank}
                className={`border-b border-gray-50 last:border-0 ${
                  isCurrentUser ? 'bg-pink-50 rounded' : ''
                }`}
              >
                <td className="py-2 text-xs text-gray-500 font-mono">
                  {rankBadge(entry.rank)}
                </td>
                <td className={`py-2 font-medium truncate max-w-[120px] ${
                  isCurrentUser ? 'text-pink-600' : 'text-gray-700'
                }`}>
                  {entry.displayName}
                  {isCurrentUser && (
                    <span className="ml-1 text-xs text-pink-400 font-normal">(you)</span>
                  )}
                </td>
                <td className="py-2 text-right text-xs text-gray-600">
                  {(entry.xpTotal ?? 0).toLocaleString()}
                </td>
                <td className="py-2 text-right text-xs text-gray-500 pl-3">
                  {entry.level}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {currentRank && currentRank > 5 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Your rank: <span className="font-medium text-gray-600">#{currentRank}</span>
        </p>
      )}

      <div className="mt-4 text-center">
        <Link
          href="/dashboard/student/leaderboard"
          className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
        >
          View full leaderboard →
        </Link>
      </div>
    </div>
  )
}
