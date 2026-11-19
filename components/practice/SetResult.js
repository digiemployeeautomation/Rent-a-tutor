// components/practice/SetResult.js
//
// Shared result renderer for deterministic-graded sets (Reading + Listening).
// Server component — receives the loaded grade + navigation links and renders
// the score header plus the per-question review from
// grade.feedback.per_question. Handles grading-in-progress and error states so
// both section result pages stay tiny.
//
// Props: { grade, retryHref, homeHref, pathHref, pathLabel, nextHref, nextLabel,
//          band, bandVariant, timeTakenSeconds, timedOut, optionLabels }
//   - band/bandVariant/timeTakenSeconds/timedOut are optional (mock results only)
//   - optionLabels: { [questionId]: { [value]: label } } so "i" reads as
//     "i. A wider choice of food" in the review (optional)
import Link from 'next/link'
import {
  ArrowRight, CheckCircle2, Clock, Info, Loader2, Quote, RotateCcw, TriangleAlert, XCircle,
} from 'lucide-react'
import { formatClock } from '@/lib/ielts/exam-timer'

function formatAnswer(value, labels) {
  if (value == null) return null
  const one = (v) => (labels && labels[v] != null ? labels[v] : String(v))
  if (Array.isArray(value)) return value.length ? value.map(one).join(', ') : null
  const s = String(value)
  return s.trim() === '' ? null : one(s)
}

function verdict(pct) {
  if (pct >= 80) return { title: 'Excellent work', line: 'You are handling this question type well.' }
  if (pct >= 60) return { title: 'Good work', line: 'A solid score. Read the explanations for the ones you missed.' }
  if (pct >= 40) return { title: 'Getting there', line: 'Read why each answer is right, then try the set again.' }
  return { title: 'Keep practising', line: 'Every mistake below comes with the reason. Read them, then try again.' }
}

function ScoreRing({ score, total, pct }) {
  const r = 52
  const c = 2 * Math.PI * r
  const good = pct >= 60
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-ink-100" />
        <circle
          cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - (total ? score / total : 0))}
          className={good ? 'stroke-emerald-500' : 'stroke-sun-400'}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold text-ink-900">
          {score}<span className="text-xl text-ink-300">/{total}</span>
        </span>
        <span className="text-xs font-medium text-ink-400">{pct}%</span>
      </div>
    </div>
  )
}

export default function SetResult({
  grade,
  retryHref,
  homeHref = '/practice',
  pathHref,
  pathLabel = 'Reading path',
  nextHref,
  nextLabel,
  band = null,
  bandVariant = null,
  timeTakenSeconds = null,
  timedOut = false,
  optionLabels = {},
}) {
  if (!grade) {
    return (
      <div className="card card-pad mt-6 flex items-start gap-4" role="status">
        <span className="icon-tile bg-blue-50 text-blue-600"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /></span>
        <div>
          <p className="font-semibold text-ink-900">Marking your answers…</p>
          <p className="mt-1 text-[15px] text-ink-600">This usually takes a few seconds. Refresh the page to see your score.</p>
          <a href="" className="btn-secondary btn-sm mt-3">Refresh</a>
        </div>
      </div>
    )
  }

  const feedback = grade.feedback ?? {}
  const perQuestion = Array.isArray(feedback.per_question) ? feedback.per_question : null

  if (!perQuestion) {
    return (
      <div className="card card-pad mt-6 flex items-start gap-4" role="alert">
        <span className="icon-tile bg-rose-50 text-rose-600"><TriangleAlert className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <p className="font-semibold text-ink-900">We could not mark this attempt</p>
          <p className="mt-1 text-[15px] text-ink-600">Something went wrong on our side. Please try the set again.</p>
          {retryHref ? (
            <Link href={retryHref} className="btn-primary mt-4"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again</Link>
          ) : null}
        </div>
      </div>
    )
  }

  const rawScore = feedback.raw_score ?? 0
  const total = feedback.total ?? 0
  const percentage = feedback.percentage ?? (total ? Math.round((rawScore / total) * 100) : 0)
  const v = verdict(percentage)
  const wrongCount = perQuestion.filter((q) => !q.correct).length
  const rightCount = perQuestion.length - wrongCount
  // Multi-answer questions carry more than one mark, so say "marks" when the
  // score is not simply one per question.
  const unit = total === perQuestion.length ? '' : ' marks'

  return (
    <>
      {/* Score */}
      <section className="card mt-6 overflow-hidden" aria-label="Your score">
        <div className="flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
          <ScoreRing score={rawScore} total={total} pct={percentage} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{v.title}</h2>
            <p className="mt-1 text-[16px] text-ink-600">
              You got <strong className="text-ink-900">{rawScore} of {total}{unit}</strong> right. {v.line}
            </p>
            {timeTakenSeconds != null ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-500">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {timedOut ? `Time ran out (${formatClock(timeTakenSeconds)})` : `Finished in ${formatClock(timeTakenSeconds)}`}
              </p>
            ) : null}
          </div>
          {band != null ? (
            <div className="w-full shrink-0 rounded-2xl bg-ink-900 px-6 py-5 text-center text-white sm:w-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-sun-300">Estimated band</p>
              <p className="mt-1 font-display text-5xl font-bold">{Number(band).toFixed(1)}</p>
              <p className="mt-1 text-xs text-ink-200">{bandVariant === 'general' ? 'General Training' : 'Academic'}</p>
            </div>
          ) : null}
        </div>
        <div className="flex items-start gap-2 border-t border-ink-100 bg-ink-50/60 px-6 py-3 text-sm text-ink-500 sm:px-8">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {band != null
            ? 'The band is an estimate from a short set, using the published IELTS score tables. A full-length test gives a more reliable band.'
            : 'This practice set shows your raw score. Band scores are estimated only on the timed mock exams.'}
        </div>
      </section>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {nextHref ? (
          <Link href={nextHref} className="btn-primary btn-lg">
            Next lesson{nextLabel ? `: ${nextLabel}` : ''} <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        ) : null}
        {retryHref ? (
          <Link href={retryHref} className={nextHref ? 'btn-secondary btn-lg' : 'btn-primary btn-lg'}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
          </Link>
        ) : null}
        {pathHref ? (
          <Link href={pathHref} className="btn-secondary btn-lg">{pathLabel}</Link>
        ) : null}
        <Link href={homeHref} className="btn-secondary btn-lg">Back to IELTS</Link>
      </div>

      {/* Review */}
      <section className="mt-10" aria-labelledby="review-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="review-title" className="h-section">Check each answer</h2>
          <p className="text-sm text-ink-500">
            {rightCount} of {perQuestion.length} questions right · {wrongCount} to review
          </p>
        </div>
        <ol className="mt-4 space-y-3">
          {perQuestion.map((q) => {
            const labels = optionLabels[q.question_id] ?? null
            const yours = formatAnswer(q.your_answer, labels)
            const correct = formatAnswer(q.correct_answer, labels)
            const ex = q.explanation
            return (
              <li
                key={q.question_id ?? q.position}
                className={`card overflow-hidden border-l-4 ${q.correct ? '!border-l-emerald-500' : '!border-l-rose-400'}`}
              >
                <div className="p-5">
                  <div className="flex gap-3">
                    {q.correct
                      ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-label="Correct" />
                      : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-label="Wrong" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold leading-snug text-ink-900">
                        {q.position}. {q.prompt}
                        {q.max_marks > 1 ? (
                          <span className="ml-2 whitespace-nowrap text-sm font-medium text-ink-400">
                            {q.marks} of {q.max_marks} marks
                          </span>
                        ) : null}
                      </p>
                      <dl className="mt-3 grid gap-2 text-[15px] sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">Your answer</dt>
                          <dd className={q.correct ? 'font-medium text-emerald-700' : 'text-rose-700'}>
                            {yours ?? <span className="italic text-ink-400">No answer</span>}
                          </dd>
                        </div>
                        {!q.correct ? (
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">Correct answer</dt>
                            <dd className="font-medium text-emerald-700">{correct ?? '—'}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  </div>
                </div>
                {ex && (ex.rationale || ex.evidence || ex.distractors) ? (
                  <div className="space-y-2 border-t border-ink-100 bg-ink-50/60 px-5 py-4 text-[15px] leading-relaxed text-ink-700">
                    {ex.rationale ? (
                      <p><span className="font-semibold text-ink-900">Why: </span>{ex.rationale}</p>
                    ) : null}
                    {ex.evidence ? (
                      <p className="flex gap-2 text-ink-600">
                        <Quote className="mt-1 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                        <span><span className="font-semibold text-ink-800">In the text: </span>{ex.evidence}</span>
                      </p>
                    ) : null}
                    {ex.distractors && typeof ex.distractors === 'object' ? (
                      <ul className="space-y-1 text-ink-600">
                        {Object.entries(ex.distractors).map(([opt, note]) => (
                          <li key={opt}>
                            <span className="font-semibold text-ink-800">{labels?.[opt] ?? opt}: </span>{String(note)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      </section>
    </>
  )
}
