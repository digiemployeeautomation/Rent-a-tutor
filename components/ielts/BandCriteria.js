// components/ielts/BandCriteria.js
//
// Shared result pieces for IELTS Writing and Speaking, so both result pages
// look and read the same. Server-safe (no hooks, no 'use client').
//
//   <ResultHeader eyebrow band sample />   overall band, stamp (shared IELTS result header)
//   <GradeNotice gradedBy skill />         honesty notice: demo sample vs AI examiner
//   <CriteriaBands bands feedback criteria />  ruled list: one row per criterion
//   <BandHighlights bands criteria />      strongest area + what to work on next
//   <GradePending /> / <GradeFailed />     states before / instead of a grade
import Link from 'next/link'
import { ArrowRight, Check, RefreshCw } from 'lucide-react'
import BandScale from '@/components/kit/BandScale'
import Stamp from '@/components/kit/Stamp'

export const WRITING_CRITERIA = [
  { key: 'task_response', label: 'Task achievement / response', hint: 'Did you answer every part of the task, with clear, supported ideas?' },
  { key: 'coherence', label: 'Coherence and cohesion', hint: 'Is your writing well organised, with clear paragraphs and linking words?' },
  { key: 'lexical', label: 'Lexical resource', hint: 'How wide and accurate is your vocabulary?' },
  { key: 'grammar', label: 'Grammatical range and accuracy', hint: 'Do you use a mix of sentence types, with few mistakes?' },
]

export const SPEAKING_CRITERIA = [
  { key: 'fluency', label: 'Fluency and coherence', hint: 'Do you speak smoothly, with few long pauses, and link your ideas?' },
  { key: 'lexical', label: 'Lexical resource', hint: 'How wide and accurate is your vocabulary?' },
  { key: 'grammar', label: 'Grammatical range and accuracy', hint: 'Do you use a mix of sentence types, with few mistakes?' },
  { key: 'pronunciation', label: 'Pronunciation', hint: 'Is your speech easy to understand, with clear stress and intonation?' },
]

// Task 1 is marked on "Task achievement", Task 2 on "Task response".
export function writingCriteriaFor(subSkill) {
  const label = subSkill === 'writing-task-2' ? 'Task response' : String(subSkill || '').startsWith('writing-task-1') ? 'Task achievement' : null
  if (!label) return WRITING_CRITERIA
  return WRITING_CRITERIA.map((c) => (c.key === 'task_response' ? { ...c, label } : c))
}

// Official IELTS band score descriptions (the "user" labels on the 0-9 scale).
const BAND_WORDS = {
  9: 'Expert user', 8: 'Very good user', 7: 'Good user', 6: 'Competent user',
  5: 'Modest user', 4: 'Limited user', 3: 'Extremely limited user',
  2: 'Intermittent user', 1: 'Non-user', 0: 'Did not attempt',
}

export function isStubGrade(grade) {
  return grade?.graded_by === 'stub'
}

export function formatBand(n) {
  const v = Number(n)
  return Number.isFinite(v) ? v.toFixed(1) : '–'
}

function bandWord(n) {
  const v = Math.floor(Number(n))
  return BAND_WORDS[Math.max(0, Math.min(9, v))] ?? ''
}

// ── Result header ─────────────────────────────────────────────────────────
// The same header the Reading and Listening results use: eyebrow, the band as
// a large numeral, a stamp, then the 4-9 ruler. `sample` (demo grader) changes
// the stamp and the label so nobody mistakes the number for a real assessment.
export function ResultHeader({ eyebrow, band, sample = false, meta }) {
  const shown = formatBand(band)
  const word = bandWord(band)
  return (
    <header className="flex items-start justify-between gap-6 border-b-2 border-ink-900 pb-6">
      <div className="min-w-0">
        <p className="eyebrow !text-copper-700">{eyebrow}</p>
        <p className="numeral mt-2 text-[4.5rem] leading-none text-ink-900 sm:text-[6rem]">{shown}</p>
        <p className="mt-2 text-[15px] font-semibold text-ink-600">
          {sample ? 'Sample overall band' : `Overall band${word ? ` · ${word}` : ''}`}
        </p>
        {meta ? <p className="mt-1 text-[13px] font-semibold text-ink-500">{meta}</p> : null}
      </div>
      <Stamp word={sample ? 'Demo' : `Band ${shown}`} tone="copper" ring="IELTS practice" className="h-24 w-24 sm:h-32 sm:w-32" />
    </header>
  )
}

// The 4-9 ruler under the header (and under the notice, when there is one).
export function ResultScale({ band, target }) {
  return <BandScale band={band} target={target} className="mt-8 max-w-md" />
}

// ── Honesty notice ────────────────────────────────────────────────────────
// skill: 'writing' | 'speaking'
export function GradeNotice({ gradedBy, skill = 'writing' }) {
  if (gradedBy === 'stub') {
    const speaking = skill === 'speaking'
    return (
      <div role="note" className="rounded-b-lg bg-sun-100 px-4 py-3.5 text-[15px] leading-relaxed text-ink-800 sm:px-5">
        <p>
          <strong className="font-bold text-ink-900">Sample feedback: demo mode.</strong>{' '}
          The AI examiner is not switched on here, so this band and the comments below are examples.{' '}
          {speaking
            ? 'They are not based on your recording, and the transcript shown is a fixed example sentence, not what you said.'
            : 'They are not based on what you wrote. Only the length of your answer changes the band, and the comments are fixed text.'}
          {' '}With the AI examiner switched on, you get a real band estimate and comments on what you actually {speaking ? 'said' : 'wrote'}.
        </p>
      </div>
    )
  }
  return (
    <p role="note" className="mt-4 text-[15px] leading-relaxed text-ink-600">
      <strong className="font-bold text-ink-900">Marked by the AI examiner.</strong>{' '}
      This is an estimate to guide your practice, not an official IELTS score.
    </p>
  )
}

// ── Four criteria: a ruled list, one row each ─────────────────────────────
// Position of a band on the 4-9 scale, as a percentage (same scale as BandScale).
function scalePos(v) {
  return ((Math.max(4, Math.min(9, v)) - 4) / 5) * 100
}

export function CriteriaBands({ bands = {}, feedback = {}, criteria }) {
  return (
    <ol className="rows">
      {criteria.map((c) => {
        const v = Number(bands?.[c.key])
        const has = Number.isFinite(v)
        const text = feedback?.[c.key]
        return (
          <li key={c.key} className="py-5 sm:py-6">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <h3 className="text-[17px] font-bold leading-snug text-ink-900">{c.label}</h3>
                <p className="mt-1 text-[15px] leading-snug text-ink-500">{c.hint}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {has ? (
                  <span className="relative hidden h-[3px] w-16 bg-ink-200 min-[420px]:block" aria-hidden="true">
                    <span className="absolute inset-y-0 left-0 bg-copper-500" style={{ width: `${scalePos(v)}%` }} />
                  </span>
                ) : null}
                <span className="numeral w-[2.6rem] text-right text-[1.75rem] leading-none text-copper-700" aria-label={has ? `Band ${formatBand(v)}` : 'No band'}>
                  {has ? formatBand(v) : '–'}
                </span>
              </div>
            </div>
            {text ? <p className="mt-3 max-w-[62ch] text-[17px] leading-[1.6] text-ink-800">{text}</p> : null}
          </li>
        )
      })}
    </ol>
  )
}

// ── Strongest area + next focus: two plain lists ──────────────────────────
// A diagnosis, so the pages only show it for a real assessment (not a sample).
export function BandHighlights({ bands = {}, criteria }) {
  const scored = criteria
    .map((c) => ({ ...c, band: Number(bands?.[c.key]) }))
    .filter((c) => Number.isFinite(c.band))
  if (scored.length < 2) return null

  const max = Math.max(...scored.map((c) => c.band))
  const min = Math.min(...scored.map((c) => c.band))
  const even = max === min
  const best = scored.filter((c) => c.band === max)
  const weak = scored.filter((c) => c.band === min)

  if (even) {
    return (
      <div>
        <h3 className="h-sub">Your four scores are level</h3>
        <p className="mt-2 max-w-[62ch] text-[17px] leading-[1.6] text-ink-800">
          All four are at band {formatBand(max)}. Pick any one criterion above: raising one of them lifts your overall band.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
      <div>
        <h3 className="h-sub">What went well</h3>
        <ul className="mt-3 space-y-2.5">
          {best.map((c) => (
            <li key={c.key} className="flex gap-2.5 text-[17px] leading-snug text-ink-800">
              <Check className="mt-1 h-4 w-4 shrink-0 text-board-700" strokeWidth={3} aria-hidden="true" />
              <span><span className="font-semibold text-ink-900">{c.label}</span>, band {formatBand(c.band)}. Keep doing what you did here.</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="h-sub">Work on next</h3>
        <ul className="mt-3 space-y-2.5">
          {weak.map((c) => (
            <li key={c.key} className="flex gap-2.5 text-[17px] leading-snug text-ink-800">
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-copper-700" strokeWidth={2.5} aria-hidden="true" />
              <span><span className="font-semibold text-ink-900">{c.label}</span>, band {formatBand(c.band)}. Read the comment for it above.</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── States without a usable grade ─────────────────────────────────────────
// Both keep the shape of the result header, so the page does not jump when
// the band arrives.
export function GradePending({ href, eyebrow = 'IELTS · Your result', what = 'answer' }) {
  return (
    <div role="status">
      <header className="border-b-2 border-ink-900 pb-6">
        <p className="eyebrow !text-copper-700">{eyebrow}</p>
        {/* A quiet block where the band will be */}
        <div className="mt-2 h-[4.5rem] w-36 rounded-lg bg-ink-100 sm:h-[6rem] sm:w-48" aria-hidden="true" />
        <p className="mt-2 text-[15px] font-semibold text-ink-600">Overall band · marking in progress</p>
      </header>
      <h2 className="h-section mt-6">Still marking your {what}</h2>
      <p className="mt-2 max-w-[62ch] text-[17px] leading-[1.6] text-ink-700">
        This usually takes a few seconds. Your {what} is saved. Check again to see your band and feedback.
      </p>
      <Link href={href} className="btn-primary mt-5">
        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Check again
      </Link>
    </div>
  )
}

export function GradeFailed({ retryHref, retryLabel = 'Try again', eyebrow = 'IELTS · Your result' }) {
  return (
    <div role="alert">
      <header className="border-b-2 border-ink-900 pb-6">
        <p className="eyebrow !text-copper-700">{eyebrow}</p>
        <h2 className="h-page mt-2">We could not mark this answer</h2>
      </header>
      <p className="rounded-b-lg bg-rose-50 px-4 py-3.5 text-[15px] leading-relaxed text-ink-800 sm:px-5">
        <strong className="font-bold text-rose-700">Not marked.</strong>{' '}
        Something went wrong on our side while marking. Nothing is wrong with your answer. Please try again.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href={retryHref} className="btn-primary">{retryLabel}</Link>
        <Link href="/practice" className="btn-secondary">Back to IELTS</Link>
      </div>
    </div>
  )
}
