'use client'

import FeedCard from './FeedCard'

export default function StreakCard({ days = 0 }) {
  const active = days > 0

  return (
    <FeedCard delay={50}>
      <div className="flex flex-col items-center text-center gap-2">
        {/* Flame icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-10 h-10 ${active ? 'text-pink-500 animate-pulse' : 'text-gray-300'}`}
        >
          <path
            fillRule="evenodd"
            d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z"
            clipRule="evenodd"
          />
        </svg>

        <div>
          <span className={`text-3xl font-bold ${active ? 'text-pink-600' : 'text-gray-400'}`}>
            {days}
          </span>
          <span className="text-sm text-gray-500 ml-1">
            day{days !== 1 ? 's' : ''}
          </span>
        </div>

        <p className={`text-xs font-medium ${active ? 'text-pink-500' : 'text-gray-400'}`}>
          {active ? 'Keep it going!' : 'Start your streak!'}
        </p>
      </div>
    </FeedCard>
  )
}
