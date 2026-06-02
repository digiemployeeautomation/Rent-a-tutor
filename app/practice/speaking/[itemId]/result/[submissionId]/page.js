// app/practice/speaking/[itemId]/result/[submissionId]/page.js
//
// Renders a graded Speaking submission. Auth-gated; RLS ensures users only
// ever see their own grades. Plays back the student's recording via a
// service-role signed URL, and shows the transcript the grade was based on.
// Mirrors the Writing result page.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClientFor, createServiceRoleClient } from '@/lib/supabaseServer'
import { signedAudioUrl, SUBMISSION_AUDIO_BUCKET } from '@/lib/storage/audio'

const CRITERION_LABELS = {
  fluency:       'Fluency & Coherence',
  lexical:       'Lexical Resource',
  grammar:       'Grammatical Range',
  pronunciation: 'Pronunciation',
}

export default async function SpeakingResultPage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/practice/speaking/${params.itemId}/result/${params.submissionId}`)
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

  // Item for header context.
  const { data: item } = await supabase
    .from('practice_items')
    .select('id, payload, sub_skill, variant')
    .eq('id', submission.practice_item_id)
    .single()

  // Sign a short-lived URL for playback (service role — private bucket).
  let playbackUrl = null
  const audioPath = submission.payload?.audio_path
  if (audioPath) {
    try {
      const admin = createServiceRoleClient()
      playbackUrl = await signedAudioUrl(admin, {
        bucket: SUBMISSION_AUDIO_BUCKET,
        path: audioPath,
      })
    } catch {
      playbackUrl = null
    }
  }

  const transcript = grade?.feedback?.transcript ?? ''

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`/practice/speaking/${params.itemId}`} className="text-xs text-gray-400 hover:text-gray-600">
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
          <p className="mt-2 text-sm text-red-700">{grade.feedback?.error ?? 'Please try recording again.'}</p>
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

          {playbackUrl ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-gray-800">Your recording</h2>
              <audio controls src={playbackUrl} className="mt-3 w-full" />
            </section>
          ) : null}

          {transcript ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-gray-800">Transcript</h2>
              <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
                {transcript}
              </div>
            </section>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/student"
              className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Back to dashboard
            </Link>
            <Link
              href={`/practice/speaking/${params.itemId}`}
              className="rounded-xl border border-gray-200 px-6 py-3 text-center font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Try again
            </Link>
          </div>

          <p className="mt-8 text-xs text-gray-400">
            This is an estimated band based on a transcript of your recording. Official IELTS scores
            can only be issued by Cambridge / IDP / British Council.
          </p>
        </>
      )}
    </main>
  )
}
