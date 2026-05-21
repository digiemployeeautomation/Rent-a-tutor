// app/practice/writing/[itemId]/result/[submissionId]/page.js
//
// Renders a graded writing submission. Auth-gated; RLS ensures users
// only ever see their own grades.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'

const CRITERION_LABELS = {
  task_response: 'Task Response',
  coherence:     'Coherence & Cohesion',
  lexical:       'Lexical Resource',
  grammar:       'Grammatical Range',
}

export default async function WritingResultPage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/practice/writing/${params.itemId}/result/${params.submissionId}`)
  }

  const [{ data: submission }, { data: grade }] = await Promise.all([
    supabase
      .from('submissions')
      .select('id, user_id, practice_item_id, payload, status, submitted_at')
      .eq('id', params.submissionId)
      .single(),
    supabase
      .from('grades')
      .select('*')
      .eq('submission_id', params.submissionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!submission || submission.user_id !== user.id) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-800">Result not found</h1>
        <p className="mt-2 text-gray-500">
          This submission does not exist or is not available right now.
        </p>
      </main>
    )
  }

  // Item for header context
  const { data: item } = await supabase
    .from('practice_items')
    .select('id, payload, sub_skill, variant')
    .eq('id', submission.practice_item_id)
    .single()

  const responseText = submission.payload?.response_text ?? ''

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`/practice/writing/${params.itemId}`} className="text-xs text-gray-400 hover:text-gray-600">
        ← Back to task
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-800">Your estimated band</h1>

      {!grade ? (
        <div className="mt-8 rounded-2xl bg-yellow-50 px-6 py-8 text-yellow-900">
          <p className="font-semibold">Grading in progress…</p>
          <p className="mt-2 text-sm text-yellow-700">Refresh in a moment to see your band score and feedback.</p>
        </div>
      ) : grade.band_overall == null ? (
        <div className="mt-8 rounded-2xl bg-red-50 px-6 py-8 text-red-900">
          <p className="font-semibold">Grading failed</p>
          <p className="mt-2 text-sm text-red-700">{grade.feedback?.error ?? 'Please try submitting again.'}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-10 text-center text-white">
            <div className="text-sm uppercase tracking-wide text-blue-200">Estimated overall band</div>
            <div className="mt-2 text-7xl font-bold">{Number(grade.band_overall).toFixed(1)}</div>
            <div className="mt-2 text-xs text-blue-200">
              {grade.graded_by === 'stub'
                ? 'Stub grader (development mode)'
                : `Graded by ${grade.model_version}`}
            </div>
          </div>

          <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(grade.band_per_criterion ?? {}).map(([key, value]) => (
              <div key={key} className="rounded-2xl bg-white border border-gray-200 px-5 py-4 text-center">
                <div className="text-xs uppercase tracking-wide text-gray-400">{CRITERION_LABELS[key] || key}</div>
                <div className="mt-1 text-3xl font-bold text-blue-700">{Number(value).toFixed(1)}</div>
              </div>
            ))}
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Feedback</h2>
            {Object.entries(grade.feedback?.per_criterion ?? {}).map(([key, text]) => (
              <div key={key} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="text-xs uppercase tracking-wide text-gray-400">{CRITERION_LABELS[key] || key}</div>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">{text}</p>
              </div>
            ))}
          </section>

          {grade.feedback?.model_rewrite ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-gray-800">Model rewrite</h2>
              <div className="mt-3 whitespace-pre-line rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-800">
                {grade.feedback.model_rewrite}
              </div>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-800">Your response</h2>
            <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
              {responseText}
            </div>
          </section>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/student"
              className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Back to dashboard
            </Link>
            <Link
              href={`/practice/writing/${params.itemId}`}
              className="rounded-xl border border-gray-200 px-6 py-3 text-center font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Try again
            </Link>
          </div>

          <p className="mt-8 text-xs text-gray-400">
            This is an estimated band based on your response. Official IELTS scores can only be issued by Cambridge / IDP / British Council.
          </p>
        </>
      )}
    </main>
  )
}
