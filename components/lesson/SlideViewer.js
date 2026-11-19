'use client'
// components/lesson/SlideViewer.js
//
// One idea per screen for the IELTS strategy lessons (skill_lessons.slides_data
// blocks: { tag, title, content, bullets, answer, image }). "Slide 2 of 6" with
// a segmented progress line (tap a segment to jump), the slide set at a reading
// measure, then Back / Next (and the arrow keys). On the last slide the primary
// action becomes "Practise this now" when `practiceHref` is set.
//
// Props: { slidesData, practiceHref, practiceLabel }
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import Segments from '@/components/kit/Segments'

const TAGS = {
  foundational: 'The basics',
  'core-full': 'The method',
  'worked-medium': 'Worked example',
  'common-mistakes': 'Watch out',
  recap: 'Checklist',
}

function tagLabel(tag) {
  if (!tag) return null
  if (TAGS[tag]) return TAGS[tag]
  const text = String(tag).replace(/-/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function SlideViewer({ slidesData, practiceHref, practiceLabel = 'Practise this now' }) {
  const slides = Array.isArray(slidesData) ? slidesData : []
  const total = slides.length
  const [index, setIndex] = useState(0)

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goNext = useCallback(() => setIndex((i) => Math.min(total - 1, i + 1)), [total])

  useEffect(() => {
    function onKey(e) {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  if (total === 0) {
    return (
      <div className="border-y-2 border-ink-900 py-8">
        <p className="h-section">This lesson&apos;s slides are on their way.</p>
        <p className="mt-1.5 text-[15px] text-ink-600">You can still try the practice set below.</p>
      </div>
    )
  }

  const slide = slides[index]
  const label = tagLabel(slide.tag)
  const isLast = index === total - 1
  const isChecklist = slide.tag === 'recap'
  // Bullets that are already written as "1. …", "2. …" become a numbered list
  // with printed numerals, instead of a dot in front of each number.
  const bullets = Array.isArray(slide.bullets) ? slide.bullets.map((b) => String(b)) : []
  const numbered = bullets.length > 1 && bullets.every((b, i) => b.startsWith(`${i + 1}. `))

  return (
    <div>
      {/* Where you are */}
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[13px] font-bold leading-5 text-ink-900 tabular">
          Slide {index + 1} <span className="font-semibold text-ink-500">of {total}</span>
        </p>
        {label ? <p className="text-[13px] font-bold leading-5 text-copper-700">{label}</p> : null}
      </div>
      <div className="relative mt-2">
        <Segments total={total} done={index + 1} tone="copper" label={`Slide ${index + 1} of ${total}`} />
        <div className="absolute inset-x-0 -inset-y-3 flex gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? 'step' : undefined}
              className="flex-1 rounded"
            />
          ))}
        </div>
      </div>

      {/* The slide: a page of the workbook */}
      <div className="card mt-4 overflow-hidden">
        <div key={index} className="min-h-[19rem] animate-fade-in-up px-5 py-7 sm:min-h-[21rem] sm:px-10 sm:py-10" aria-live="polite">
          {slide.title ? (
            <h2 className="max-w-[24ch] text-balance font-display text-[1.625rem] font-semibold leading-[1.12] text-ink-900 sm:text-[2rem]" style={{ letterSpacing: '-0.025em' }}>
              {slide.title}
            </h2>
          ) : null}

          {slide.content ? (
            <div className="mt-4 max-w-[62ch] space-y-4">
              {String(slide.content).split(/\n\n+/).map((p, i) => (
                <p key={i} className="whitespace-pre-line text-[17px] leading-[1.65] text-ink-700">{p}</p>
              ))}
            </div>
          ) : null}

          {numbered ? (
            <ol className="mt-5 max-w-[62ch] space-y-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-baseline gap-3 text-[17px] leading-[1.55] text-ink-800">
                  <span className="numeral w-5 shrink-0 text-[1.25rem] leading-none text-copper-600" aria-hidden="true">{i + 1}</span>
                  <span><span className="sr-only">{i + 1}. </span>{b.slice(`${i + 1}. `.length)}</span>
                </li>
              ))}
            </ol>
          ) : bullets.length > 0 ? (
            <ul className="mt-5 max-w-[62ch] space-y-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-[17px] leading-[1.55] text-ink-800">
                  {isChecklist ? (
                    <Check className="mt-[5px] h-[18px] w-[18px] shrink-0 text-board-700" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-copper-600" aria-hidden="true" />
                  )}
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {slide.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.image}
              alt={slide.title ?? `Slide ${index + 1}`}
              className="mt-6 max-h-72 max-w-full rounded-lg object-contain"
            />
          ) : null}

          {slide.answer ? (
            <div className="mt-6 max-w-[62ch] rounded-lg bg-board-50 px-4 py-3.5">
              <p className="text-[13px] font-bold leading-5 text-board-800">Answer</p>
              <p className="mt-0.5 text-[17px] leading-[1.55] text-ink-900">{slide.answer}</p>
            </div>
          ) : null}

          {isLast && practiceHref ? (
            <p className="mt-8 max-w-[62ch] border-t border-ink-200 pt-5 text-[15px] leading-relaxed text-ink-600">
              <span className="font-bold text-ink-900">You have finished the lesson.</span>{' '}
              Now use the method on a short, auto-marked practice set.
            </p>
          ) : null}
        </div>

        {/* Back / Next */}
        <div className="flex items-center justify-between gap-3 border-t border-ink-200 px-4 py-3 sm:px-6 sm:py-4">
          <button type="button" onClick={goPrev} disabled={index === 0} className="btn-secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>

          <p className="hidden text-[13px] text-ink-500 md:block">
            You can also use the ← and → keys.
          </p>

          {isLast ? (
            practiceHref ? (
              <Link href={practiceHref} className="btn-primary group">
                {practiceLabel} <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className="text-sm font-semibold text-ink-500">End of lesson</span>
            )
          ) : (
            <button type="button" onClick={goNext} className="btn-primary group">
              Next <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
