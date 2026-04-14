'use client'

import { useState } from 'react'
import { TIERS } from '@/lib/tier-config'

const TIER_KEYS = ['guided', 'balanced', 'exam_ready']

export default function TierRecommendation({ recommendedTier, onConfirm }) {
  const [selectedTier, setSelectedTier] = useState(recommendedTier)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Your recommended learning style</h2>
        <p className="mt-1 text-sm text-gray-500">
          Based on your answers, we suggest the{' '}
          <span className="font-semibold text-blue-600">{TIERS[recommendedTier]?.name}</span> tier.
          You can choose a different one below.
        </p>
      </div>

      <div className="space-y-3">
        {TIER_KEYS.map((tierKey) => {
          const tier = TIERS[tierKey]
          const isRecommended = tierKey === recommendedTier
          const isSelected = tierKey === selectedTier

          return (
            <button
              key={tierKey}
              onClick={() => setSelectedTier(tierKey)}
              className={`relative w-full rounded-2xl border-2 p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                      {tier.name}
                    </span>
                    {isRecommended && (
                      <span className="rounded-full bg-pink-500 px-2 py-0.5 text-xs font-medium text-white">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{tier.description}</p>
                </div>

                {/* Radio indicator */}
                <div
                  className={`mt-1 h-5 w-5 flex-shrink-0 rounded-full border-2 ${
                    isSelected ? 'border-blue-600' : 'border-gray-300'
                  } flex items-center justify-center`}
                >
                  {isSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => onConfirm(selectedTier)}
        className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Continue with {TIERS[selectedTier]?.name}
      </button>
    </div>
  )
}
