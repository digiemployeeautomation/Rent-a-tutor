'use client'

import { getXPForNextLevel, LEVELS } from '@/lib/xp'

export default function XPBar({ xpTotal = 0, currentLevel = 1 }) {
  const xpToNext = getXPForNextLevel(xpTotal)
  const isMaxLevel = xpToNext === null

  // XP at start of current level
  const levelStartXP = LEVELS[currentLevel - 1] ?? 0
  // XP needed to reach next level from current level start
  const levelEndXP = isMaxLevel ? xpTotal : (LEVELS[currentLevel] ?? xpTotal)
  const levelRange = levelEndXP - levelStartXP
  const xpIntoLevel = xpTotal - levelStartXP
  const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.round((xpIntoLevel / levelRange) * 100))

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-forest-600">
          Level {currentLevel}
        </span>
        <span className="text-xs text-gray-500">
          {isMaxLevel ? 'Max level' : `${xpToNext} XP to next level`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: '#3b6d11', // forest-500
          }}
        />
      </div>

      <div className="text-xs text-gray-400">
        {xpTotal.toLocaleString()} XP total
      </div>
    </div>
  )
}
