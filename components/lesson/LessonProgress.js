'use client'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// ── icons ────────────────────────────────────────────────────────────────────

function VideoIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function SlidesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function QuizIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function StepIcon({ type, isCompleted, isCurrent, isFuture }) {
  const iconClass = classNames(
    'h-4 w-4',
    isCompleted ? 'text-white' : isCurrent ? 'text-white' : 'text-gray-400'
  )

  if (isCompleted) {
    return <CheckIcon className={iconClass} />
  }

  if (type === 'video') return <VideoIcon className={iconClass} />
  if (type === 'slides') return <SlidesIcon className={iconClass} />
  return <QuizIcon className={iconClass} />
}

// ── main component ────────────────────────────────────────────────────────────

export default function LessonProgress({ sections, currentIndex, completedIndexes }) {
  if (!sections || sections.length === 0) return null

  const completedSet = new Set(completedIndexes ?? [])

  return (
    <div className="w-full">
      {/* Desktop: horizontal row */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1 scrollbar-hide">
        {sections.map((section, idx) => {
          const isCompleted = completedSet.has(idx)
          const isCurrent   = idx === currentIndex
          const isFuture    = idx > currentIndex && !isCompleted

          const dotSize = isCurrent ? 'h-9 w-9' : 'h-7 w-7'
          const dotColor = isCompleted
            ? 'bg-green-500 border-green-500'
            : isCurrent
              ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-100'
              : 'bg-white border-gray-300'

          return (
            <div key={idx} className="flex items-center flex-shrink-0">
              {/* Connector line (before each step except the first) */}
              {idx > 0 && (
                <div className={classNames(
                  'h-0.5 w-6 flex-shrink-0',
                  completedSet.has(idx - 1) ? 'bg-green-400' : idx <= currentIndex ? 'bg-blue-300' : 'bg-gray-200'
                )} />
              )}

              {/* Step dot */}
              <div className="relative flex flex-col items-center">
                <div className={classNames(
                  'flex items-center justify-center rounded-full border-2 transition-all duration-200',
                  dotSize,
                  dotColor
                )}>
                  <StepIcon
                    type={section.type}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    isFuture={isFuture}
                  />
                </div>

                {/* Label below dot — only visible on md+ screens */}
                <span className={classNames(
                  'hidden md:block absolute top-full mt-1.5 text-center text-xs whitespace-nowrap leading-tight',
                  isCurrent   ? 'font-semibold text-blue-700' :
                  isCompleted ? 'text-green-600' :
                                'text-gray-400'
                )} style={{ fontSize: '10px', maxWidth: '64px', top: '100%' }}>
                  {section.label ?? typeLabel(section.type, idx)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step counter text */}
      <p className="mt-1 text-xs text-gray-400 text-right pr-1">
        Step {currentIndex + 1} of {sections.length}
      </p>
    </div>
  )
}

function typeLabel(type, idx) {
  if (type === 'video')  return `Video ${idx + 1}`
  if (type === 'slides') return `Slides ${idx + 1}`
  return `Quiz ${idx + 1}`
}
