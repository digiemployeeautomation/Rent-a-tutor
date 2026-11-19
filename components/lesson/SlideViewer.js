'use client'
// components/lesson/SlideViewer.js
//
// One idea per screen for the IELTS strategy lessons (skill_lessons.slides_data
// blocks: { tag, title, content, bullets, answer, image }). Progress bar +
// dots, large readable type, Back/Next (and the arrow keys). On the last slide
// it shows the "Practise this now" call to action when `practiceHref` is set.
//
// Props: { slidesData, practiceHref, practiceLabel }
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, FileText, Lightbulb, ListChecks,
  Sparkles, TriangleAlert, Wrench,
} from 'lucide-react'

const TAGS = {
  foundational: { label: 'The basics', icon: BookOpen, tone: 'bg-teal-50 text-teal-700' },
  'core-full': { label: 'The method', icon: Wrench, tone: 'bg-blue-50 text-blue-700' },
  'worked-medium': { label: 'Worked example', icon: Sparkles, tone: 'bg-sun-100 text-sun-600' },
  'common-mistakes': { label: 'Watch out', icon: TriangleAlert, tone: 'bg-rose-50 text-rose-700' },
  recap: { label: 'Checklist', icon: ListChecks, tone: 'bg-emerald-50 text-emerald-700' },
}

function tagMeta(tag) {
  if (!tag) return null
  return TAGS[tag] ?? {
    label: String(tag).replace(/-/g, ' '),
    icon: Lightbulb,
    tone: 'bg-ink-50 text-ink-600',
  }
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
      <div className="card card-pad flex flex-col items-center gap-3 py-12 text-center">
        <span className="icon-tile bg-ink-50 text-ink-400"><FileText className="h-5 w-5" aria-hidden="true" /></span>
        <p className="text-[15px] font-medium text-ink-700">This lesson&apos;s slides are on their way.</p>
        <p className="muted">You can still try the practice set below.</p>
      </div>
    )
  }

  const slide = slides[index]
  const meta = tagMeta(slide.tag)
  const isLast = index === total - 1
  const pct = Math.round(((index + 1) / total) * 100)

  return (
    <div className="card overflow-hidden">
      {/* Progress */}
      <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-3 sm:px-8">
        <div
          className="progress-track flex-1"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label="Lesson progress"
        >
          <div className="h-full rounded-full bg-teal-600 transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-400">
          {index + 1} of {total}
        </span>
      </div>

      {/* Slide */}
      <div key={index} className="min-h-[18rem] px-5 py-7 animate-fade-in-up sm:px-8 sm:py-10" aria-live="polite">
        {meta ? (
          <p className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${meta.tone}`}>
            <meta.icon className="h-3.5 w-3.5" aria-hidden="true" /> {meta.label}
          </p>
        ) : null}

        {slide.title ? (
          <h2 className="font-display text-[26px] font-bold leading-tight text-ink-900 sm:text-3xl">{slide.title}</h2>
        ) : null}

        {slide.content ? (
          <div className="mt-4 space-y-4">
            {String(slide.content).split(/\n\n+/).map((p, i) => (
              <p key={i} className="whitespace-pre-line text-[17px] leading-relaxed text-ink-700">{p}</p>
            ))}
          </div>
        ) : null}

        {Array.isArray(slide.bullets) && slide.bullets.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {slide.bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-[16px] leading-relaxed text-ink-700">
                <span className="mt-[9px] h-2 w-2 shrink-0 rounded-full bg-teal-600" aria-hidden="true" />
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
            className="mt-6 max-h-72 max-w-full rounded-xl object-contain"
          />
        ) : null}

        {slide.answer ? (
          <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Answer</p>
              <p className="mt-1 text-[16px] leading-relaxed text-ink-800">{slide.answer}</p>
            </div>
          </div>
        ) : null}

        {isLast && practiceHref ? (
          <div className="mt-8 rounded-2xl bg-ink-900 p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="font-display text-lg font-bold">You have finished the lesson</p>
              <p className="mt-1 text-sm text-ink-200">Now use the method on a short, auto-marked practice set.</p>
            </div>
            <Link href={practiceHref} className="btn-accent mt-4 w-full sm:mt-0 sm:w-auto">
              {practiceLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>

      {/* Dots + navigation */}
      <div className="flex items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-4 py-3 sm:px-6">
        <button type="button" onClick={goPrev} disabled={index === 0} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </button>

        <div className="hidden items-center gap-1.5 sm:flex">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? 'step' : undefined}
              className="flex h-8 w-6 items-center justify-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span
                className={`block rounded-full transition-all duration-200 ${
                  i === index ? 'h-2.5 w-2.5 bg-teal-600' : i < index ? 'h-2 w-2 bg-teal-300' : 'h-2 w-2 bg-ink-200'
                }`}
              />
            </button>
          ))}
        </div>

        {isLast ? (
          practiceHref ? (
            <Link href={practiceHref} className="btn-primary">
              Practise <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className="text-sm font-medium text-ink-400">End of lesson</span>
          )
        ) : (
          <button type="button" onClick={goNext} className="btn-primary">
            Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="hidden border-t border-ink-100 px-6 py-2 text-center text-xs text-ink-400 md:block">
        Tip: use the ← and → keys to move between slides.
      </p>
    </div>
  )
}
