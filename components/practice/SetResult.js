// components/practice/SetResult.js
//
// Shared result renderer for deterministic-graded sets (Reading + Listening).
// Server component — receives the loaded grade + navigation links and renders
// the score header plus the per-question review from
// grade.feedback.per_question. Handles grading-in-progress and error states so
// both section result pages stay tiny.
//
// Props: { grade, backHref, retryHref, dashboardHref, title }
import Link from 'next/link'

function formatAnswer(value) {
  if (value == null) return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  const s = String(value)
  return s.trim() === '' ? '—' : s
}

export default function SetResult({
  grade,
  backHref,
  retryHref,
  dashboardHref = '/dashboard/student',
  title = 'Your score',
}) {
  if (!grade) {
    return (
      <div className="mt-8 rounded-2xl bg-yellow-50 px-6 py-8 text-yellow-900">
        <p className="font-semibold">Grading in progress…</p>
        <p className="mt-2 text-sm text-yellow-700">
          Refresh in a moment to see your score and answer review.
        </p>
      </div>
    )
  }

  const feedback = grade.feedback ?? {}
  const perQuestion = Array.isArray(feedback.per_question) ? feedback.per_question : null

  if (!perQuestion) {
    return (
      <div className="mt-8 rounded-2xl bg-red-50 px-6 py-8 text-red-900">
        <p className="font-semibold">Grading failed</p>
        <p className="mt-2 text-sm text-red-700">
          {feedback.error ?? 'Please try submitting again.'}
        </p>
      </div>
    )
  }

  const rawScore = feedback.raw_score ?? 0
  const total = feedback.total ?? 0
  const percentage = feedback.percentage ?? 0

  return (
    <>
      <div className="mt-6 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-10 text-center text-white">
        <div className="text-sm uppercase tracking-wide text-blue-200">{title}</div>
        <div className="mt-2 text-7xl font-bold">
          {rawScore}
          <span className="text-3xl font-medium text-blue-200"> / {total}</span>
        </div>
        <div className="mt-2 text-xs text-blue-200">{percentage}% correct</div>
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold text-gray-800">Answer review</h2>
        {perQuestion.map((q) => (
          <div
            key={q.question_id ?? q.position}
            className={`rounded-2xl border p-5 ${
              q.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-gray-800">
                {q.position}. {q.prompt}
              </p>
              <span
                className={`shrink-0 text-sm font-semibold ${
                  q.correct ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {q.correct ? '✓' : '✗'} {q.marks}/{q.max_marks}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Your answer</dt>
                <dd className="text-gray-800">{formatAnswer(q.your_answer)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Correct answer</dt>
                <dd className="text-gray-800">{formatAnswer(q.correct_answer)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href={dashboardHref}
          className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Back to dashboard
        </Link>
        {retryHref ? (
          <Link
            href={retryHref}
            className="rounded-xl border border-gray-200 px-6 py-3 text-center font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Try again
          </Link>
        ) : null}
        {backHref ? (
          <Link
            href={backHref}
            className="rounded-xl border border-gray-200 px-6 py-3 text-center font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Back to set
          </Link>
        ) : null}
      </div>

      <p className="mt-8 text-xs text-gray-400">
        Raw score for this set. A full band score is estimated only across a complete mock test.
      </p>
    </>
  )
}
