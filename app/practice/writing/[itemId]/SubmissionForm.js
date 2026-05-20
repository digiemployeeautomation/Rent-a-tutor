'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmissionForm({ itemId, minimumWords }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const wordCount = useMemo(() => {
    return text.trim().split(/\s+/).filter(Boolean).length
  }, [text])

  const meetsMin = wordCount >= Math.floor(minimumWords * 0.5)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      // 1) create the submission
      const subRes = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practice_item_id: itemId,
          payload: { response_text: text },
        }),
      })
      if (!subRes.ok) {
        const body = await subRes.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to submit response')
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

      router.push(`/practice/writing/${itemId}/result/${submission.id}`)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Your response</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={16}
        placeholder="Write your response here…"
        className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {wordCount} word{wordCount === 1 ? '' : 's'} •
          target {minimumWords}+
        </span>
        {wordCount > 0 && !meetsMin && (
          <span className="text-orange-500">Aim for at least {Math.floor(minimumWords * 0.5)} words to get a meaningful grade.</span>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || text.trim().length === 0}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-opacity hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 sm:w-auto"
        >
          {submitting ? 'Submitting & grading…' : 'Submit for grading'}
        </button>
      </div>
    </div>
  )
}
