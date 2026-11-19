// components/ielts/BandCriteria.js
//
// Shared result pieces for IELTS Writing and Speaking, so both result pages
// look and read the same. Server-safe (no hooks, no 'use client').
//
//   <GradeNotice gradedBy skill />        honesty notice: stub vs AI examiner
//   <OverallBand band skill />            the big overall band
//   <BandHighlights bands labels />       strongest area + what to work on next
//   <CriteriaBands bands feedback criteria />  four labelled bars + feedback
//   <GradePending /> / <GradeFailed />    states before / instead of a grade
import Link from 'next/link'
import {
  AlertTriangle, Bot, Clock, FlaskConical, RefreshCw, Target, TrendingUp,
} from 'lucide-react'

export const WRITING_CRITERIA = [
  { key: 'task_response', label: 'Task Achievement / Response', hint: 'Did you answer every part of the task, with clear, supported ideas?' },
  { key: 'coherence', label: 'Coherence & Cohesion', hint: 'Is your writing well organised, with clear paragraphs and linking words?' },
  { key: 'lexical', label: 'Lexical Resource', hint: 'How wide and accurate is your vocabulary?' },
  { key: 'grammar', label: 'Grammatical Range & Accuracy', hint: 'Do you use a mix of sentence types, with few mistakes?' },
]

export const SPEAKING_CRITERIA = [
  { key: 'fluency', label: 'Fluency & Coherence', hint: 'Do you speak smoothly, with few long pauses, and link your ideas?' },
  { key: 'lexical', label: 'Lexical Resource', hint: 'How wide and accurate is your vocabulary?' },
  { key: 'grammar', label: 'Grammatical Range & Accuracy', hint: 'Do you use a mix of sentence types, with few mistakes?' },
  { key: 'pronunciation', label: 'Pronunciation', hint: 'Is your speech easy to understand, with clear stress and intonation?' },
]

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

// ── Honesty notice ────────────────────────────────────────────────────────
// skill: 'writing' | 'speaking'
export function GradeNotice({ gradedBy, skill = 'writing' }) {
  if (gradedBy === 'stub') {
    return (
      <div role="note" className="flex gap-3 rounded-2xl border border-sun-200 bg-sun-50 p-4 sm:p-5">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-sun-600" aria-hidden="true" />
        <div>
          <p className="font-semibold text-ink-900">Sample feedback — demo mode</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">
            The AI examiner is not connected in this environment, so these scores are
            illustrative and are not based on your {skill === 'speaking' ? 'recording' : 'answer'}
            {skill === 'speaking' ? '.' : ' (only its length changes them).'}
            {skill === 'speaking'
              ? ' The transcript shown is a fixed example sentence, not what you said.'
              : ' The feedback text is a fixed example.'}
            {' '}With the AI examiner switched on, you get a real band estimate and comments on what you actually {skill === 'speaking' ? 'said' : 'wrote'}.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div role="note" className="flex items-start gap-2.5 rounded-xl bg-teal-50 px-4 py-3 text-sm text-ink-700">
      <Bot className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
      <p>
        <span className="font-semibold text-teal-800">Marked by AI examiner.</span>{' '}
        This is an estimate to guide your practice, not an official IELTS score.
      </p>
    </div>
  )
}

// ── Overall band ──────────────────────────────────────────────────────────
export function OverallBand({ band, label = 'Estimated overall band', sample = false }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col items-center gap-1 bg-ink-900 px-6 py-8 text-center text-white sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:text-left">
        <div className="font-display text-7xl font-bold leading-none tracking-tight tabular-nums text-sun-400 sm:text-8xl">
          {formatBand(band)}
        </div>
        <div className="mt-2 sm:mt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-300">{label}</p>
          <p className="mt-1 font-display text-xl font-semibold">{bandWord(band)}</p>
          <p className="mt-1 text-sm text-ink-300">
            {sample ? 'Sample score for the demo — not a real assessment.' : 'IELTS bands go from 0 to 9, in half-band steps.'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Strongest area + next focus ───────────────────────────────────────────
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

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="card card-pad flex gap-3">
        <span className="icon-tile bg-emerald-50 text-emerald-700"><TrendingUp className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Strongest area</p>
          <p className="mt-1 font-semibold text-ink-900">
            {even ? 'Your four scores are level' : best.map((c) => c.label).join(', ')}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">{even ? `All at band ${formatBand(max)}.` : `Band ${formatBand(max)} — keep doing what you did here.`}</p>
        </div>
      </div>
      <div className="card card-pad flex gap-3">
        <span className="icon-tile bg-blue-50 text-blue-700"><Target className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Work on next</p>
          <p className="mt-1 font-semibold text-ink-900">
            {even ? 'Pick any one criterion below' : weak.map((c) => c.label).join(', ')}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">
            {even ? 'Raising any one of them lifts your overall band.' : `Band ${formatBand(min)} — read the tip for it below.`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Four criteria with bars and feedback ──────────────────────────────────
export function CriteriaBands({ bands = {}, feedback = {}, criteria }) {
  return (
    <ul className="card divide-y divide-ink-100">
      {criteria.map((c) => {
        const v = Number(bands?.[c.key])
        const has = Number.isFinite(v)
        const pct = has ? Math.max(0, Math.min(100, (v / 9) * 100)) : 0
        const text = feedback?.[c.key]
        return (
          <li key={c.key} className="px-5 py-5 sm:px-6">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-base font-semibold text-ink-900 sm:text-lg">{c.label}</h3>
              <span className="shrink-0 font-display text-2xl font-bold tabular-nums text-teal-700">{has ? formatBand(v) : '–'}</span>
            </div>
            <p className="mt-0.5 text-sm text-ink-400">{c.hint}</p>
            <div
              className="progress-track mt-3"
              role="meter"
              aria-label={`${c.label} band`}
              aria-valuemin={0}
              aria-valuemax={9}
              aria-valuenow={has ? v : 0}
            >
              <div className="progress-fill bg-teal-600" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] font-medium text-ink-300" aria-hidden="true">
              <span>0</span><span>9</span>
            </div>
            {text ? (
              <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{text}</p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

// ── States without a usable grade ─────────────────────────────────────────
export function GradePending({ href }) {
  return (
    <div className="card card-pad flex gap-3" role="status">
      <span className="icon-tile bg-sun-100 text-sun-600"><Clock className="h-5 w-5" aria-hidden="true" /></span>
      <div>
        <p className="font-semibold text-ink-900">Still marking your answer…</p>
        <p className="mt-1 text-sm text-ink-500">This usually takes a few seconds. Refresh the page to see your band and feedback.</p>
        <Link href={href} className="btn-secondary btn-sm mt-4"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh</Link>
      </div>
    </div>
  )
}

export function GradeFailed({ retryHref, retryLabel = 'Try again' }) {
  return (
    <div className="card card-pad flex gap-3" role="alert">
      <span className="icon-tile bg-rose-50 text-rose-600"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></span>
      <div>
        <p className="font-semibold text-ink-900">We could not mark this answer</p>
        <p className="mt-1 text-sm text-ink-500">Something went wrong on our side while marking. Nothing is wrong with your answer — please try again.</p>
        <Link href={retryHref} className="btn-primary btn-sm mt-4">{retryLabel}</Link>
      </div>
    </div>
  )
}
