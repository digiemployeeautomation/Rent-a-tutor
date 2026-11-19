'use client'
// components/practice/QuestionSetRunner.js
//
// Client runner for a Reading or Listening set. Lays out the material (`aside`:
// the passage or the audio player) next to the questions on large screens,
// mounts the right interaction primitive for each question (via the shared
// question-type registry), and keeps a fixed bottom bar with the timer (timed
// sets), the answered count and the submit button. On submit it creates a
// submission and triggers grading — the same two-step flow the Writing
// SubmissionForm uses — before routing to the result page.
//
// On phones a passage and its questions are two tabs ("Passage" / "Questions")
// that each remember their scroll position; an audio player stays stacked
// above the questions (it pins itself under the top bar).
//
// Props: { item, questions, resultBase, timeLimitSeconds, aside, asideTitle, asideKind }
//   - questions: rows { id, position, prompt, question_type, options }
//   - resultBase: e.g. `/practice/reading/${item.id}/result` (section-agnostic)
//   - timeLimitSeconds: positive number → timed set (countdown + warn-and-lock);
//     null/absent → untimed
//   - aside: server-rendered node (passage / audio) shown beside the questions
//   - asideKind: 'passage' (default; tabs on phones) | 'audio' (stacked, the
//     node brings its own <section>)
//
// Answer shapes match the submission payload contract:
//   single_select → string, multi_select → string[], text_fill → string

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { getQuestionType, primitiveFor } from '@/lib/ielts/question-types'
import SingleSelect from '@/components/practice/questions/SingleSelect'
import MultiSelect from '@/components/practice/questions/MultiSelect'
import TextFill from '@/components/practice/questions/TextFill'
import { computeRemaining, formatClock } from '@/lib/ielts/exam-timer'

const NAV_OFFSET = 61 + 49 // the sticky top bar (60px + hairline) and the tab row under it

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
  asideKind = 'passage',
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

  // Phones: which of the two panes is showing (passage sets only).
  const tabbed = !!aside && asideKind !== 'audio'
  const [pane, setPane] = useState('material')
  const layoutRef = useRef(null)
  const paneScroll = useRef({ material: null, questions: null })
  const pendingScroll = useRef(null)

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

  // After a tab switch on a phone, put the reader back where they were in that
  // pane (or at its top the first time), or on the question they asked for.
  useEffect(() => {
    const target = pendingScroll.current
    if (target == null) return
    pendingScroll.current = null
    if (typeof target === 'string') {
      document.getElementById(target)?.scrollIntoView({ block: 'start', behavior: 'instant' })
      return
    }
    window.scrollTo({ top: target, behavior: 'instant' })
  }, [pane])

  function showPane(next, questionId = null) {
    if (next === pane) {
      if (questionId) document.getElementById(questionId)?.scrollIntoView({ block: 'start' })
      return
    }
    paneScroll.current[pane] = window.scrollY
    const paneTop = layoutRef.current
      ? layoutRef.current.getBoundingClientRect().top + window.scrollY - NAV_OFFSET
      : 0
    pendingScroll.current = questionId ?? paneScroll.current[next] ?? Math.min(window.scrollY, Math.max(0, paneTop))
    setPane(next)
  }

  function setAnswer(questionId, value) {
    if (timeUp) return
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const groups = useMemo(() => groupQuestions(questions), [questions])
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length
  const unanswered = questions.filter((q) => !isAnswered(answers[q.id])).map((q) => q.position)
  const total = questions.length

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
  const audio = !!aside && asideKind === 'audio'

  return (
    <>
      {/* Phones: switch between the passage and the questions */}
      {tabbed ? (
        <div
          role="tablist"
          aria-label="Passage and questions"
          className="no-print sticky top-[61px] z-20 -mx-5 flex border-b border-ink-300 bg-paper px-5 sm:-mx-8 sm:px-8 lg:hidden"
        >
          {[
            { key: 'material', label: asideTitle },
            { key: 'questions', label: 'Questions', count: `${answeredCount} of ${total}` },
          ].map((t) => {
            const active = pane === t.key
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={active}
                aria-controls={`pane-${t.key}`}
                onClick={() => showPane(t.key)}
                className={`relative flex min-h-[48px] flex-1 items-center justify-center gap-2 text-[15px] font-bold ${active ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'}`}
              >
                {t.label}
                {t.count ? <span className="text-[13px] font-semibold text-ink-500 tabular">{t.count}</span> : null}
                <span
                  className={`absolute inset-x-0 -bottom-px h-[3px] bg-ink-900 transition-opacity duration-150 ${active ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>
      ) : null}

      <div
        ref={layoutRef}
        className={`pb-12 md:pb-32 lg:grid lg:items-start ${
          audio ? 'lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:gap-14' : aside ? 'lg:grid-cols-2 lg:gap-10' : ''
        } ${tabbed ? 'pt-5 lg:pt-0' : ''}`}
      >
        {/* Material: passage or audio */}
        {audio ? aside : null}
        {tabbed ? (
          <section
            id="pane-material"
            aria-label={asideTitle}
            className={`lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-13rem)] lg:flex-col ${pane === 'material' ? '' : 'hidden'}`}
          >
            {aside}
            <button
              type="button"
              onClick={() => showPane('questions')}
              className="btn-secondary mt-5 w-full lg:hidden"
            >
              Go to the questions <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </section>
        ) : null}

        {/* Questions */}
        <section
          id="pane-questions"
          aria-label="Questions"
          className={`${audio ? 'mt-8 max-w-[40rem] lg:mt-0' : ''} ${tabbed && pane !== 'questions' ? 'hidden lg:block' : ''}`}
        >
          {timeUp ? (
            <div role="alert" className="mb-6 rounded-lg border border-sun-300 bg-sun-100 px-4 py-3.5">
              <p className="h-sub">Time is up</p>
              <p className="mt-0.5 text-[15px] leading-snug text-ink-700">Your answers are locked. Press “Check answers” to see your score.</p>
            </div>
          ) : null}

          {total === 0 ? (
            <p className="border-t-2 border-ink-900 pt-4 text-[15px] text-ink-600">The questions for this set are not ready yet.</p>
          ) : null}

          <div className={`space-y-10 ${timeUp ? 'pointer-events-none opacity-60' : ''}`} aria-disabled={timeUp || undefined}>
            {groups.map((g) => {
              const meta = getQuestionType(g.type)
              const first = g.items[0].position
              const last = g.items[g.items.length - 1].position
              return (
                <div key={`${g.type}-${first}`}>
                  <div className="border-b-2 border-ink-900 pb-2.5">
                    <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                      <span className="h-sub tabular">{first === last ? `Question ${first}` : `Questions ${first}–${last}`}</span>
                      {meta ? <span className="text-[13px] font-semibold text-ink-500">{meta.label}</span> : null}
                    </p>
                    {meta?.instruction ? <p className="mt-0.5 text-[15px] leading-snug text-ink-600">{meta.instruction}</p> : null}
                  </div>
                  <ol className="rows">
                    {g.items.map((question) => {
                      const primitive = primitiveFor(question.question_type)
                      const qMeta = getQuestionType(question.question_type)
                      const value = answers[question.id]
                      // fixedOptions (TFNG/YNNG) take priority, else the question's own choices.
                      const options = qMeta?.fixedOptions ?? question.options?.choices ?? []
                      return (
                        <li key={question.id} id={`question-${question.position}`} className="scroll-mt-32 py-5 lg:scroll-mt-24">
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
                            <p className="text-[15px] text-ink-600">
                              {question.position}. {question.prompt}
                              <span className="ml-2 text-[13px] text-ink-500">(this question type cannot be shown yet)</span>
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
      <div className="no-print fixed inset-x-0 bottom-16 z-30 border-t border-ink-300 bg-white md:bottom-0">
        <div className="container-app py-2.5 sm:py-3">
          {error ? (
            <p role="alert" className="mb-2.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold leading-snug text-rose-700">{error}</p>
          ) : null}
          <div className="flex items-center gap-3.5 sm:gap-6">
            {timed && remaining != null ? (
              <p
                className={`shrink-0 leading-none ${timeUp ? 'text-rose-700' : lowTime ? 'text-sun-700' : 'text-ink-900'}`}
                role="timer"
                aria-label={`Time left ${formatClock(remaining)}`}
              >
                <span className="numeral tabular block text-[1.625rem] leading-none sm:text-[1.75rem]">{formatClock(remaining)}</span>
                <span className="mt-1 block text-xs font-bold leading-none">{timeUp ? 'Time is up' : lowTime ? 'Last minute' : 'Time left'}</span>
              </p>
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-ink-600 tabular" aria-live="polite">
                <span className={`font-bold text-ink-900 ${timed ? 'block text-[15px] sm:inline sm:text-sm' : ''}`}>{answeredCount} of {total}</span>{' '}
                <span className={timed ? 'mt-0.5 block text-xs font-bold sm:mt-0 sm:inline sm:text-sm sm:font-semibold' : ''}>answered</span>
              </p>
              {/* Question navigator: which are answered, and a jump to each */}
              {total > 0 && total <= 20 ? (
                <ol className="mt-1.5 hidden gap-1 md:flex" aria-label="Go to a question">
                  {questions.map((q) => {
                    const done = isAnswered(answers[q.id])
                    return (
                      <li key={q.id}>
                        <button
                          type="button"
                          onClick={() => showPane('questions', `question-${q.position}`)}
                          aria-label={`Question ${q.position}, ${done ? 'answered' : 'not answered'}`}
                          className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded border px-1 text-[13px] font-bold leading-none tabular transition-colors duration-150 ${
                            done
                              ? 'border-board-700 bg-board-700 text-chalk hover:bg-board-800'
                              : 'border-ink-300 bg-white text-ink-700 hover:border-ink-900'
                          }`}
                        >
                          {q.position}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              ) : null}
            </div>

            <button
              type="button"
              onClick={requestSubmit}
              disabled={submitting || (answeredCount === 0 && !timeUp)}
              className="btn-primary shrink-0 px-4 sm:min-h-[52px] sm:px-7 sm:text-base"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Marking…</>
              ) : (
                'Check answers'
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
            className="w-full max-w-md animate-fade-in-up rounded-t-2xl bg-white p-6 shadow-lg sm:rounded-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="h-section">
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
