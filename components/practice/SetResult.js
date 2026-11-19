// components/practice/SetResult.js
//
// Shared result renderer for deterministic-graded sets (Reading + Listening).
// Server component — receives the loaded grade + navigation links and renders
// the result header (the big numeral, the stamp, the band ruler), the actions,
// and the per-question review from grade.feedback.per_question. Handles
// grading-in-progress and error states so both section result pages stay tiny.
//
// The header follows the pattern shared by every IELTS result screen: eyebrow,
// one large numeral (the band when there is one, else the raw score), a plain
// line under it, and the stamp at the right.
//
// Props: { grade, eyebrow, title, retryHref, homeHref, pathHref, pathLabel,
//          nextHref, nextLabel, band, bandVariant, target, timeTakenSeconds,
//          timedOut, optionLabels }
//   - band/bandVariant/timeTakenSeconds/timedOut are optional (mock results only)
//   - target: the student's target band, only if the page already has it
//   - optionLabels: { [questionId]: { [value]: label } } so "i" reads as
//     "i. A wider choice of food" in the review (optional)
import Link from 'next/link'
import { ArrowRight, Check, Loader2, RotateCcw, X } from 'lucide-react'
import { formatClock } from '@/lib/ielts/exam-timer'
import Stamp from '@/components/kit/Stamp'
import BandScale from '@/components/kit/BandScale'

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

function Heading({ eyebrow, title }) {
  return (
    <>
      {eyebrow ? <p className="eyebrow !text-copper-700">{eyebrow}</p> : null}
      {title ? <h1 className="mt-1 font-sans text-[17px] font-bold leading-snug text-ink-900" style={{ letterSpacing: 0 }}>{title}</h1> : null}
    </>
  )
}

export default function SetResult({
  grade,
  eyebrow,
  title,
  retryHref,
  homeHref = '/practice',
  pathHref,
  pathLabel = 'Reading path',
  nextHref,
  nextLabel,
  band = null,
  bandVariant = null,
  target = null,
  timeTakenSeconds = null,
  timedOut = false,
  optionLabels = {},
}) {
  if (!grade) {
    return (
      <div role="status">
        <header className="border-b-2 border-ink-900 pb-6">
          <Heading eyebrow={eyebrow} title={title} />
          <p className="h-page mt-4 flex items-center gap-3">
            <Loader2 className="h-6 w-6 shrink-0 animate-spin text-ink-400" aria-hidden="true" /> Marking your answers…
          </p>
        </header>
        <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-ink-700">
          This usually takes a few seconds. Refresh the page to see your score.
        </p>
        <a href="" className="btn-primary mt-5">Refresh</a>
      </div>
    )
  }

  const feedback = grade.feedback ?? {}
  const perQuestion = Array.isArray(feedback.per_question) ? feedback.per_question : null

  if (!perQuestion) {
    return (
      <div role="alert">
        <header className="border-b-2 border-ink-900 pb-6">
          <Heading eyebrow={eyebrow} title={title} />
          <p className="h-page mt-4">We could not mark this attempt</p>
        </header>
        <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-ink-700">
          Something went wrong on our side. Please try the set again.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {retryHref ? (
            <Link href={retryHref} className="btn-primary"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again</Link>
          ) : null}
          <Link href={homeHref} className="btn-secondary">Back to IELTS</Link>
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
  const perMark = total !== perQuestion.length
  const hasBand = band != null
  const bandText = hasBand ? Number(band).toFixed(1) : null

  return (
    <>
      {/* Result header */}
      <header className="flex items-start justify-between gap-6 border-b-2 border-ink-900 pb-6">
        <div className="min-w-0">
          <Heading eyebrow={eyebrow} title={title} />
          {hasBand ? (
            <p className="numeral mt-2 text-[4.5rem] leading-none text-ink-900 sm:text-[6rem]">{bandText}</p>
          ) : (
            <p className="numeral mt-2 text-[4.5rem] leading-none text-ink-900 sm:text-[6rem]" aria-label={`${rawScore} out of ${total}`}>
              {rawScore}<span className="text-ink-400">/{total}</span>
            </p>
          )}
          <p className="mt-2 text-[15px] font-semibold text-ink-600">
            {hasBand
              ? `Estimated band · ${rawScore} of ${total}${perMark ? ' marks' : ' correct'}${bandVariant ? ` · ${bandVariant === 'general' ? 'General Training' : 'Academic'}` : ''}`
              : `Raw score · ${percentage}% ${perMark ? 'of the marks' : 'correct'}`}
          </p>
        </div>
        <Stamp
          word={hasBand ? `Band ${bandText}` : 'Done'}
          tone="copper"
          ring="IELTS practice"
          className="h-24 w-24 sm:h-32 sm:w-32"
        />
      </header>

      {hasBand ? <BandScale band={band} target={target ?? undefined} className="mt-6 max-w-md" /> : null}

      <div className="mt-6 max-w-[62ch]">
        <p className="text-[17px] leading-relaxed text-ink-700">
          <strong className="font-bold text-ink-900">{v.title}.</strong> {v.line}
          {timeTakenSeconds != null ? (
            <> {timedOut ? `Time ran out (${formatClock(timeTakenSeconds)}).` : `You finished in ${formatClock(timeTakenSeconds)}.`}</>
          ) : null}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          {hasBand
            ? 'The band is an estimate from a short set, using the published IELTS score tables. A full-length test gives a more reliable band.'
            : 'This practice set shows your raw score. Band scores are estimated only on the timed mock exams.'}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {nextHref ? (
          <Link href={nextHref} className="btn-primary group">
            Next lesson{nextLabel ? `: ${nextLabel}` : ''} <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
        {retryHref ? (
          <Link href={retryHref} className={nextHref ? 'btn-secondary' : 'btn-primary'}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
          </Link>
        ) : null}
        {pathHref ? null : <Link href={homeHref} className="btn-secondary">Back to IELTS</Link>}
      </div>
      {pathHref ? (
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
          <Link href={pathHref} className="link inline-flex min-h-[44px] items-center">{pathLabel}</Link>
          <Link href={homeHref} className="link inline-flex min-h-[44px] items-center">Back to IELTS</Link>
        </p>
      ) : null}

      {/* Review */}
      <section className="mt-12 sm:mt-16" aria-labelledby="review-title">
        <div className="rule-head flex-wrap">
          <h2 id="review-title" className="h-section">Check each answer</h2>
          <p className="text-[13px] font-semibold text-ink-500 tabular">
            {rightCount} of {perQuestion.length} right{wrongCount > 0 ? ` · ${wrongCount} to review` : ''}
          </p>
        </div>
        <ol className="rows">
          {perQuestion.map((q) => {
            const labels = optionLabels[q.question_id] ?? null
            const yours = formatAnswer(q.your_answer, labels)
            const correct = formatAnswer(q.correct_answer, labels)
            const ex = q.explanation
            return (
              <li key={q.question_id ?? q.position} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 py-5 sm:grid-cols-[2rem_minmax(0,1fr)] sm:gap-x-4 sm:py-6">
                <div className="flex flex-col items-start gap-2">
                  <span className="numeral text-[1.375rem] leading-7 text-ink-900" aria-hidden="true">{q.position}</span>
                  {q.correct
                    ? <Check className="h-6 w-6 text-board-700" strokeWidth={3} aria-label="Correct" />
                    : <X className="h-6 w-6 text-rose-600" strokeWidth={3} aria-label="Wrong" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[17px] font-bold leading-snug text-ink-900">
                    <span className="sr-only">Question {q.position}. </span>
                    {q.prompt}
                    {q.max_marks > 1 ? (
                      <span className="ml-2 whitespace-nowrap text-[13px] font-semibold text-ink-500 tabular">
                        {q.marks} of {q.max_marks} marks
                      </span>
                    ) : null}
                  </p>
                  <dl className="mt-2.5 space-y-1.5 text-[15px] leading-snug">
                    <div className="sm:flex sm:gap-3">
                      <dt className="shrink-0 text-[13px] font-semibold leading-5 text-ink-500 sm:w-28 sm:text-[15px] sm:font-normal sm:text-ink-600">Your answer</dt>
                      <dd className={`font-bold ${q.correct ? 'text-board-700' : 'text-rose-700'}`}>
                        {yours ?? <span className="font-semibold text-ink-500">No answer</span>}
                      </dd>
                    </div>
                    {!q.correct ? (
                      <div className="sm:flex sm:gap-3">
                        <dt className="shrink-0 text-[13px] font-semibold leading-5 text-ink-500 sm:w-28 sm:text-[15px] sm:font-normal sm:text-ink-600">Correct answer</dt>
                        <dd className="font-bold text-board-700">{correct ?? '—'}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {ex && (ex.rationale || ex.evidence || ex.distractors) ? (
                    <div className="mt-3 max-w-[62ch] space-y-2 text-[15px] leading-relaxed text-ink-700">
                      {ex.rationale ? (
                        <p><span className="font-bold text-ink-900">Why: </span>{ex.rationale}</p>
                      ) : null}
                      {ex.evidence ? (
                        <p><span className="font-bold text-ink-900">In the text: </span>{ex.evidence}</p>
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
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </>
  )
}
