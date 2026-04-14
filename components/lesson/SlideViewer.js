'use client'

import { useState } from 'react'

export default function SlideViewer({ slidesData }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!slidesData || slidesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-12 text-gray-400 gap-3">
        <svg className="h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium">Slides coming soon</p>
      </div>
    )
  }

  const slide = slidesData[currentIndex]
  const total = slidesData.length

  function goToPrev() {
    setCurrentIndex(i => Math.max(0, i - 1))
  }

  function goToNext() {
    setCurrentIndex(i => Math.min(total - 1, i + 1))
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Slide content */}
      <div className="px-8 py-10 min-h-64">
        {slide.title && (
          <h2 className="font-serif text-2xl font-semibold text-gray-800 mb-4">
            {slide.title}
          </h2>
        )}

        {slide.content && (
          <p className="text-gray-600 text-base leading-relaxed mb-4">
            {slide.content}
          </p>
        )}

        {slide.bullets && slide.bullets.length > 0 && (
          <ul className="space-y-2 mb-4">
            {slide.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2 text-gray-600 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {slide.image && (
          <img
            src={slide.image}
            alt={slide.title ?? `Slide ${currentIndex + 1}`}
            className="mt-4 max-w-full rounded-lg object-contain max-h-64"
          />
        )}
      </div>

      {/* Stories-style progress dots */}
      <div className="flex items-center justify-center gap-1.5 py-3 border-t border-gray-50">
        {slidesData.map((_, idx) => {
          const isDone = idx < currentIndex
          const isCurrent = idx === currentIndex
          return (
            <div
              key={idx}
              className={[
                'rounded-full transition-all duration-200',
                isDone
                  ? 'h-2 w-2 bg-blue-500'
                  : isCurrent
                    ? 'h-2.5 w-2.5 bg-blue-500'
                    : 'h-2 w-2 bg-gray-200'
              ].join(' ')}
            />
          )
        })}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 bg-gray-50">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </button>

        <span className="text-xs text-gray-400 font-medium">
          {currentIndex + 1} / {total}
        </span>

        <button
          onClick={goToNext}
          disabled={currentIndex === total - 1}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
