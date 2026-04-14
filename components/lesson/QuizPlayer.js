'use client'

import { useState } from 'react'
import QuizOneAtATime from '@/components/lesson/QuizOneAtATime'
import QuizCardStack from '@/components/lesson/QuizCardStack'
import QuizScrollableList from '@/components/lesson/QuizScrollableList'

// ── helpers ──────────────────────────────────────────────────────────────────

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function getQuizMode(quizType, tier) {
  if (quizType === 'lesson_reflection') return 'scrollable'
  if (quizType === 'lesson_short' || quizType === 'topic_test' || quizType === 'term_exam') return 'scrollable'
  // MC and MC+TF quizzes:
  if (tier === 'guided') return 'one-at-a-time'
  if (tier === 'balanced') return quizType === 'lesson_mc' ? 'one-at-a-time' : 'card-stack'
  if (tier === 'exam_ready') return 'card-stack'
  return 'one-at-a-time'
}

// ── sub-components ───────────────────────────────────────────────────────────

function MCQuestion({ question, selectedAnswer, onSelect, result, showExplanations }) {
  const options = Array.isArray(question.options) ? question.options : []

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-800 leading-relaxed">
        {question.question_text}
      </p>

      <div className="space-y-2">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === option
          const isCorrect  = result?.correct_answer === option
          const isWrong    = result && isSelected && !result.is_correct

          return (
            <button
              key={idx}
              onClick={() => !result && onSelect(option)}
              disabled={!!result}
              className={classNames(
                'w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors',
                result
                  ? isCorrect
                    ? 'border-green-400 bg-green-50 text-green-800'
                    : isWrong
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-500 opacity-60'
                  : isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              )}
            >
              {option}
            </button>
          )
        })}
      </div>

      {result && showExplanations && result.explanation && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
          <span className="font-semibold">Explanation: </span>
          {result.explanation}
        </div>
      )}
    </div>
  )
}

function TFQuestion({ question, selectedAnswer, onSelect, result, showExplanations }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-800 leading-relaxed">
        {question.question_text}
      </p>

      <div className="flex gap-3">
        {['True', 'False'].map(option => {
          const isSelected = selectedAnswer === option
          const isCorrect  = result?.correct_answer === option
          const isWrong    = result && isSelected && !result.is_correct

          return (
            <button
              key={option}
              onClick={() => !result && onSelect(option)}
              disabled={!!result}
              className={classNames(
                'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                result
                  ? isCorrect
                    ? 'border-green-400 bg-green-50 text-green-800'
                    : isWrong
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-500 opacity-60'
                  : isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              )}
            >
              {option}
            </button>
          )
        })}
      </div>

      {result && showExplanations && result.explanation && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
          <span className="font-semibold">Explanation: </span>
          {result.explanation}
        </div>
      )}
    </div>
  )
}

function ShortQuestion({ question, answer, onChange, result }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-800 leading-relaxed">
        {question.question_text}
      </p>

      <textarea
        value={answer ?? ''}
        onChange={e => !result && onChange(e.target.value)}
        disabled={!!result}
        rows={3}
        placeholder="Type your answer here…"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none disabled:bg-gray-50 disabled:text-gray-500"
      />

      {result && (
        <div className={classNames(
          'rounded-lg px-4 py-3 text-xs',
          result.is_correct ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'
        )}>
          {result.is_correct ? 'Correct!' : `Correct answer: ${result.correct_answer}`}
          {result.explanation && <p className="mt-1 text-gray-600">{result.explanation}</p>}
        </div>
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function QuizPlayer({ quiz, questions, tierConfig, tier, onComplete }) {
  const [answers, setAnswers]           = useState({})
  const [submitting, setSubmitting]     = useState(false)
  const [gradedResults, setGradedResults] = useState(null)
  const [reflectionResult, setReflectionResult] = useState(null)
  const [error, setError]               = useState('')
  const [retryCount, setRetryCount]     = useState(0)
  const [modeAnswers, setModeAnswers]   = useState(null)

  const isReflection = quiz.quiz_type === 'lesson_reflection'
  const isGraded     = !isReflection
  const quizMode     = getQuizMode(quiz.quiz_type, tier ?? 'balanced')

  const passMarkPct   = tierConfig?.pass_mark ?? 0
  const maxRetries    = tierConfig?.max_retries ?? null
  const showExplain   = tierConfig?.show_explanations !== 'after_pass' || gradedResults?.passed

  // ── answer helpers ────────────────────────────────────────────────────────

  function setAnswer(questionId, value) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  // ── submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setError('')
    setSubmitting(true)

    try {
      if (isReflection) {
        // Single reflection textarea — grab the first question id's answer or use answers object
        const firstQId = questions[0]?.id
        const response = answers[firstQId] ?? Object.values(answers)[0] ?? ''

        const res = await fetch('/api/quiz/reflection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: quiz.id, response }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Submission failed')
        setReflectionResult(data)
      } else {
        const answersArray = questions.map(q => ({
          questionId: q.id,
          answer: answers[q.id] ?? '',
        }))

        const res = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: quiz.id, answers: answersArray }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Submission failed')
        setGradedResults(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetry() {
    setAnswers({})
    setGradedResults(null)
    setReflectionResult(null)
    setError('')
    setRetryCount(c => c + 1)
  }

  function handleContinue() {
    if (isReflection) {
      onComplete({ passed: true, score: reflectionResult?.coveredCount ?? 0, maxScore: reflectionResult?.totalPoints ?? 0 })
    } else {
      onComplete({ passed: gradedResults.passed, score: gradedResults.score, maxScore: gradedResults.maxScore })
    }
  }

  const canRetry = isGraded && gradedResults && !gradedResults.passed && (maxRetries === null || retryCount < maxRetries)

  // ── handle mode-based submission (one-at-a-time / card-stack collect answers then auto-submit) ──
  async function handleModeSubmit(answersArray) {
    setModeAnswers(answersArray)
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz.id, answers: answersArray }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setGradedResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleScrollableSubmit(answersArray) {
    setError('')
    setSubmitting(true)
    const innerAnswers = {}
    answersArray.forEach(({ questionId, answer }) => { innerAnswers[questionId] = answer })
    setAnswers(innerAnswers)
    // Use the existing handleSubmit but with the collected answers
    const doSubmit = async () => {
      try {
        if (isReflection) {
          const firstQId = questions[0]?.id
          const response = innerAnswers[firstQId] ?? Object.values(innerAnswers)[0] ?? ''
          const res = await fetch('/api/quiz/reflection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizId: quiz.id, response }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Submission failed')
          setReflectionResult(data)
        } else {
          const res = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizId: quiz.id, answers: answersArray }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Submission failed')
          setGradedResults(data)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setSubmitting(false)
      }
    }
    doSubmit()
  }

  // ── render results ────────────────────────────────────────────────────────

  if (gradedResults) {
    return (
      <div className="space-y-6">
        {/* Score summary */}
        <div className={classNames(
          'rounded-xl border p-6 text-center',
          gradedResults.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        )}>
          <div className={classNames(
            'text-4xl font-bold mb-1',
            gradedResults.passed ? 'text-green-700' : 'text-red-600'
          )}>
            {gradedResults.percentage}%
          </div>
          <div className={classNames(
            'text-sm font-medium',
            gradedResults.passed ? 'text-green-600' : 'text-red-500'
          )}>
            {gradedResults.passed ? 'Passed' : `Failed — need ${passMarkPct}% to pass`}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {gradedResults.score} / {gradedResults.maxScore} points
          </div>
        </div>

        {/* Per-question results */}
        {showExplain && gradedResults.results && (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const result = gradedResults.results.find(r => r.questionId === q.id)
              if (!result) return null

              return (
                <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className={classNames(
                      'mt-0.5 flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center',
                      result.is_correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                    )}>
                      {result.is_correct ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                    <p className="text-sm text-gray-700">{q.question_text}</p>
                  </div>
                  {!result.is_correct && (
                    <p className="text-xs text-gray-500 ml-7">
                      Correct answer: <span className="font-medium text-gray-700">{result.correct_answer}</span>
                    </p>
                  )}
                  {result.explanation && (
                    <p className="text-xs text-amber-700 ml-7 bg-amber-50 rounded px-2 py-1">
                      {result.explanation}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {canRetry && (
            <button
              onClick={handleRetry}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Try again
            </button>
          )}
          {gradedResults.passed && (
            <button
              onClick={handleContinue}
              className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    )
  }

  if (reflectionResult) {
    const coverPct = reflectionResult.totalPoints > 0
      ? Math.round((reflectionResult.coveredCount / reflectionResult.totalPoints) * 100)
      : 0

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-base font-semibold text-blue-800 mb-3">Reflection feedback</h3>

          {reflectionResult.coveredPoints?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">What you covered</p>
              <ul className="space-y-1">
                {reflectionResult.coveredPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                    <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reflectionResult.missedPoints?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Points to review</p>
              <ul className="space-y-1">
                {reflectionResult.missedPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                    <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                    </svg>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-blue-600">
            You covered {reflectionResult.coveredCount ?? 0} of {reflectionResult.totalPoints ?? 0} key points ({coverPct}%).
          </p>
        </div>

        <button
          onClick={handleContinue}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    )
  }

  // ── quiz mode rendering (one-at-a-time / card-stack) ─────────────────────

  if (isGraded && !gradedResults && quizMode === 'one-at-a-time') {
    if (submitting) {
      return (
        <div className="flex items-center justify-center py-20">
          <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )
    }
    return <QuizOneAtATime questions={questions} onSubmit={handleModeSubmit} />
  }

  if (isGraded && !gradedResults && quizMode === 'card-stack') {
    if (submitting) {
      return (
        <div className="flex items-center justify-center py-20">
          <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )
    }
    return <QuizCardStack questions={questions} onSubmit={handleModeSubmit} />
  }

  if (!gradedResults && quizMode === 'scrollable' && !isReflection) {
    const resultsList = gradedResults?.results ?? null
    return (
      <div className="space-y-6">
        <QuizScrollableList
          questions={questions}
          onSubmit={handleScrollableSubmit}
          results={resultsList}
          showExplanations={showExplain}
        />
        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</p>
        )}
        {submitting && (
          <div className="flex items-center justify-center py-4">
            <svg className="h-6 w-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>
    )
  }

  // ── question form ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {isReflection ? (
        // Single reflection textarea
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-800">
            Describe everything you learned in this lesson.
          </p>
          <textarea
            value={answers[questions[0]?.id] ?? ''}
            onChange={e => setAnswer(questions[0]?.id, e.target.value)}
            rows={8}
            placeholder="Write as much as you can remember — concepts, examples, key points…"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
          />
        </div>
      ) : (
        // Graded questions
        questions.map((q, idx) => (
          <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Question {idx + 1}
            </p>

            {q.type === 'true_false' ? (
              <TFQuestion
                question={q}
                selectedAnswer={answers[q.id]}
                onSelect={val => setAnswer(q.id, val)}
                result={null}
                showExplanations={false}
              />
            ) : q.type === 'short_answer' ? (
              <ShortQuestion
                question={q}
                answer={answers[q.id]}
                onChange={val => setAnswer(q.id, val)}
                result={null}
              />
            ) : (
              <MCQuestion
                question={q}
                selectedAnswer={answers[q.id]}
                onSelect={val => setAnswer(q.id, val)}
                result={null}
                showExplanations={false}
              />
            )}
          </div>
        ))
      )}

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting…
          </span>
        ) : (
          isReflection ? 'Submit reflection' : 'Submit answers'
        )}
      </button>
    </div>
  )
}
