'use client'

export default function ProgressRings({ subjects = [] }) {
  if (!subjects.length) {
    return (
      <div className="text-sm text-gray-400 py-4">No subjects enrolled yet.</div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
      {subjects.map((subject) => {
        const percent = Math.round(subject.percentComplete ?? 0)

        let ringColor
        if (percent > 60) {
          ringColor = '#3b6d11' // forest-500
        } else if (percent > 30) {
          ringColor = '#ef9f27' // gold-300
        } else {
          ringColor = '#9ca3af' // gray-400
        }

        return (
          <div key={subject.slug} className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {/* Background track */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                {/* Progress arc */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="3"
                  strokeDasharray={`${percent}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              {/* Percentage label in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-700">{percent}%</span>
              </div>
            </div>
            <span className="text-xs text-center text-gray-600 leading-tight max-w-[72px] truncate">
              {subject.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
