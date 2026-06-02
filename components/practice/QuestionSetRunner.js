'use client'
// components/practice/QuestionSetRunner.js
//
// Client runner for a Reading or Listening set. Renders the item header and
// iterates the questions, mounting the right interaction primitive for each
// (resolved via the shared question-type registry). Holds answers state keyed
// by question id, then on submit creates a submission and triggers grading —
// the same two-step flow the Writing SubmissionForm uses — before routing to
// the result page.
//
// Props: { item, questions, resultBase }
//   - item.payload.title / item.sub_skill drive the header
//   - questions: rows { id, position, prompt, question_type, options }
//   - resultBase: e.g. `/practice/reading/${item.id}/result` (section-agnostic)
//
// Answer shapes match the submission payload contract:
//   single_select → string, multi_select → string[], text_fill → string

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getQuestionType, primitiveFor } from '@/lib/ielts/question-types'
import { subSkillLabel } from '@/lib/ielts/sections'
import SingleSelect from '@/components/practice/questions/SingleSelect'
import MultiSelect from '@/components/practice/questions/MultiSelect'
import TextFill from '@/components/practice/questions/TextFill'

export default function QuestionSetRunner({ item, questions = [], resultBase }) {
  const router = useRouter()
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const payload = item.payload ?? {}

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      // 1) create the submission
      const subRes = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practice_item_id: item.id,
          payload: { answers },
        }),
      })
      if (!subRes.ok) {
        const body = await subRes.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to submit answers')
      }
      const { submission } = await subRes.json()

      // 2) trigger grading
      const gradeRes = await fetch(`/api/submissions/${submission.id}/grade`, {
        method: 'POST',
      })
      if (!gradeRes.ok) {
        const body = await gradeRes.json().catch(() => ({}))
        throw new Error(body.error || 'Grading failed')
      }

      router.push(`${resultBase}/${submission.id}`)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const answeredCount = questions.filter((q) => {
    const v = answers[q.id]
    if (Array.isArray(v)) return v.length > 0
    return v != null && String(v).trim() !== ''
  }).length

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-1 text-xs uppercase tracking-wider text-gray-400">
          {subSkillLabel(item.sub_skill)}
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          {payload.title || 'Practice set'}
        </h2>
      </div>

      <ol className="space-y-6">
        {questions.map((question) => {
          const primitive = primitiveFor(question.question_type)
          const meta = getQuestionType(question.question_type)
          const value = answers[question.id]

          // Resolve options: fixedOptions (TFNG/YNNG) take priority, else the
          // question's own choices from the options JSONB column.
          const options = meta?.fixedOptions ?? question.options?.choices ?? []

          return (
            <li
              key={question.id}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              {meta ? (
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-blue-500">
                  {meta.label}
                </p>
              ) : null}

              {primitive === 'single_select' ? (
                <SingleSelect
                  question={question}
                  options={options}
                  value={value}
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
                <p className="text-sm text-red-500">
                  {question.position}. {question.prompt}
                  <span className="ml-2 text-xs">(unsupported question type)</span>
                </p>
              )}
            </li>
          )
        })}
      </ol>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || answeredCount === 0}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-opacity hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 sm:w-auto"
        >
          {submitting ? 'Submitting & grading…' : 'Submit answers'}
        </button>
        <span className="text-xs text-gray-500">
          {answeredCount} of {questions.length} answered
        </span>
      </div>
    </div>
  )
}
