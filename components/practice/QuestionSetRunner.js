'use client'
// components/practice/QuestionSetRunner.js
//
// Client runner for a Reading or Listening set. Lays out the material (`aside`:
// the passage or the audio player) next to the questions on large screens and
// stacked on phones, mounts the right interaction primitive for each question
// (via the shared question-type registry), and keeps a fixed bottom bar with
// the answered count, the timer (timed sets) and the submit button. On submit
// it creates a submission and triggers grading — the same two-step flow the
// Writing SubmissionForm uses — before routing to the result page.
//
// Props: { item, questions, resultBase, timeLimitSeconds, aside, asideTitle }
//   - questions: rows { id, position, prompt, question_type, options }
//   - resultBase: e.g. `/practice/reading/${item.id}/result` (section-agnostic)
//   - timeLimitSeconds: positive number → timed set (countdown + warn-and-lock);
//     null/absent → untimed
//   - aside: server-rendered node (passage / audio) shown beside the questions
//
// Answer shapes match the submission payload contract:
//   single_select → string, multi_select → string[], text_fill → string

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowDown, Check, Loader2, Timer } from 'lucide-react'
import { getQuestionType, primitiveFor } from '@/lib/ielts/question-types'
import SingleSelect from '@/components/practice/questions/SingleSelect'
import MultiSelect from '@/components/practice/questions/MultiSelect'
import TextFill from '@/components/practice/questions/TextFill'
import { computeRemaining, formatClock } from '@/lib/ielts/exam-timer'

function isAnswered(v) {
  if (Array.isArray(v)) return v.length > 0
  return v != null && String(v).trim() !== ''
}

// Consecutive questions of the same type share one instruction header,
// like the real test ("Questions 1–3").
function groupQuestions(questions) {
  const groups = []
  for (const q of questions) {
    const last = groups[groups.length - 1]
    if (last && last.type === q.question_type) last.items.push(q)
    else groups.push({ type: q.question_type, items: [q] })
  }
  return groups
}

function listNumbers(nums) {
  if (nums.length === 1) return `Question ${nums[0]} is`
  return `Questions ${nums.slice(0, -1).join(', ')} and ${nums[nums.length - 1]} are`
}

export default function QuestionSetRunner({
  item,
  questions = [],
  resultBase,
  timeLimitSeconds = null,
  aside = null,
  asideTitle = 'Passage',
}) {
  const router = useRouter()
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const confirmBtnRef = useRef(null)

  const timed = typeof timeLimitSeconds === 'number' && timeLimitSeconds > 0
  const startedAtRef = useRef(null)
  const intervalRef = useRef(null)
  const [remaining, setRemaining] = useState(timed ? timeLimitSeconds : null)
  const [timeUp, setTimeUp] = useState(false)

  const stopClock = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // `timed` is derived from timeLimitSeconds, so the prop is the real dependency.
  useEffect(() => {
    if (!timed) return
    startedAtRef.current = Date.now()
    const tick = () => {
      const left = computeRemaining(startedAtRef.current, timeLimitSeconds, Date.now())
      setRemaining(left)
      if (left <= 0) {
        setTimeUp(true)
        stopClock() // stop ticking at zero — no wasted renders or repeated SR announcements
      }
    }
    tick()
    intervalRef.current = setInterval(tick, 1000)
    return stopClock
  }, [timed, timeLimitSeconds, stopClock])

  useEffect(() => {
    if (!confirming) return
    confirmBtnRef.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') setConfirming(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirming])

  function setAnswer(questionId, value) {
    if (timeUp) return
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const groups = useMemo(() => groupQuestions(questions), [questions])
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length
  const unanswered = questions.filter((q) => !isAnswered(answers[q.id])).map((q) => q.position)
  const total = questions.length
  const pct = total ? Math.round((answeredCount / total) * 100) : 0

  function requestSubmit() {
    if (submitting) return
    if (unanswered.length > 0 && !timeUp) {
      setConfirming(true)
      return
    }
    handleSubmit()
  }

  async function handleSubmit() {
    setConfirming(false)
    stopClock() // freeze the clock during the submit/grade round-trip
    setSubmitting(true)
    setError(null)
    try {
      // 1) create the submission
      const subRes = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practice_item_id: item.id,
          payload: {
            answers,
            ...(timed
              ? {
                  time_taken_seconds: Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000),
                  timed_out: timeUp,
                }
              : {}),
          },
        }),
      })
      if (!subRes.ok) {
        const body = await subRes.json().catch(() => ({}))
        throw new Error(body.error || 'We could not send your answers.')
      }
      const { submission } = await subRes.json()

      // 2) trigger grading
      const gradeRes = await fetch(`/api/submissions/${submission.id}/grade`, {
        method: 'POST',
      })
      if (!gradeRes.ok) {
        const body = await gradeRes.json().catch(() => ({}))
        throw new Error(body.error || 'Marking failed.')
      }

      router.push(`${resultBase}/${submission.id}`)
    } catch (err) {
      setError(`${err.message || 'Something went wrong.'} Check your connection and try again — your answers are still here.`)
      setSubmitting(false)
    }
  }

  const lowTime = timed && remaining != null && remaining <= 60

  return (
    <>
      <div className="pb-16 md:pb-28 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        {/* Material: passage or audio */}
        {aside ? (
          <section
            aria-label={asideTitle}
            className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-2xl"
          >
            {aside}
            <a
              href="#questions"
              className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-blue-700 lg:hidden"
            >
              <ArrowDown className="h-4 w-4" aria-hidden="true" /> Go to the questions
            </a>
          </section>
        ) : null}

        {/* Questions */}
        <section id="questions" aria-label="Questions" className="mt-6 scroll-mt-20 lg:mt-0">
          {timeUp ? (
            <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl border border-sun-200 bg-sun-50 p-4">
              <Timer className="mt-0.5 h-5 w-5 shrink-0 text-sun-600" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink-900">Time is up</p>
                <p className="text-sm text-ink-600">Your answers are locked. Press “Check answers” to see your score.</p>
              </div>
            </div>
          ) : null}

          {total === 0 ? (
            <div className="card card-pad text-center text-ink-500">The questions for this set are not ready yet.</div>
          ) : null}

          <div className={`space-y-5 ${timeUp ? 'pointer-events-none opacity-60' : ''}`} aria-disabled={timeUp || undefined}>
            {groups.map((g) => {
              const meta = getQuestionType(g.type)
              const first = g.items[0].position
              const last = g.items[g.items.length - 1].position
              return (
                <div key={`${g.type}-${first}`} className="card overflow-hidden">
                  <div className="border-b border-ink-100 bg-ink-50/60 px-5 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      {first === last ? `Question ${first}` : `Questions ${first}–${last}`}
                      {meta ? ` · ${meta.label}` : ''}
                    </p>
                    {meta?.instruction ? <p className="mt-0.5 text-sm text-ink-600">{meta.instruction}</p> : null}
                  </div>
                  <ol className="divide-y divide-ink-100">
                    {g.items.map((question) => {
                      const primitive = primitiveFor(question.question_type)
                      const qMeta = getQuestionType(question.question_type)
                      const value = answers[question.id]
                      // fixedOptions (TFNG/YNNG) take priority, else the question's own choices.
                      const options = qMeta?.fixedOptions ?? question.options?.choices ?? []
                      return (
                        <li key={question.id} className="px-5 py-5">
                          {primitive === 'single_select' ? (
                            <SingleSelect
                              question={question}
                              options={options}
                              value={value}
                              compact={!!qMeta?.fixedOptions}
                              onChange={(v) => setAnswer(question.id, v)}
                            />
                          ) : primitive === 'multi_select' ? (
                            <MultiSelect
                              question={question}
                              options={options}
                              value={value}
                              max={question.options?.max}
                              onChange={(v) => setAnswer(question.id, v)}
                            />
                          ) : primitive === 'text_fill' ? (
                            <TextFill
                              question={question}
                              value={value}
                              wordLimit={question.options?.word_limit}
                              onChange={(v) => setAnswer(question.id, v)}
                            />
                          ) : (
                            <p className="text-sm text-ink-500">
                              {question.position}. {question.prompt}
                              <span className="ml-2 text-xs">(this question type cannot be shown yet)</span>
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Fixed action bar */}
      <div className="no-print fixed inset-x-0 bottom-16 z-30 border-t border-ink-100 bg-white/95 backdrop-blur-md md:bottom-0">
        <div className="container-app py-3">
          {error ? (
            <p role="alert" className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}
          <div className="flex items-center gap-3">
            {timed && remaining != null ? (
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-sm font-semibold tabular-nums ${
                  timeUp ? 'bg-rose-50 text-rose-700' : lowTime ? 'bg-sun-100 text-sun-600' : 'bg-teal-50 text-teal-700'
                }`}
                role="timer"
                aria-label={`Time left ${formatClock(remaining)}`}
              >
                <Timer className="h-4 w-4" aria-hidden="true" />
                {formatClock(remaining)}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-800" aria-live="polite">
                {answeredCount} of {total} <span className="font-normal text-ink-500">answered</span>
              </p>
              <div className="progress-track mt-1 hidden max-w-xs sm:block">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={requestSubmit}
              disabled={submitting || (answeredCount === 0 && !timeUp)}
              className="btn-primary shrink-0 sm:min-h-[52px] sm:px-7 sm:text-base"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Marking…</>
              ) : (
                <><Check className="h-4 w-4" aria-hidden="true" /> Check answers</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm when questions are unanswered */}
      {confirming ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 sm:items-center sm:p-6"
          onClick={() => setConfirming(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-lift animate-fade-in-up sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="icon-tile bg-sun-100 text-sun-600"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></span>
            <h2 id="confirm-title" className="mt-4 font-display text-xl font-bold text-ink-900">
              {unanswered.length} {unanswered.length === 1 ? 'question has' : 'questions have'} no answer
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
              {listNumbers(unanswered)} still empty. An empty answer is marked wrong — in the real test it is always worth a guess.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary" onClick={handleSubmit}>
                Check anyway
              </button>
              <button ref={confirmBtnRef} type="button" className="btn-primary" onClick={() => setConfirming(false)}>
                Keep answering
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
