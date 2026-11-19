// app/practice/speaking/[itemId]/result/[submissionId]/page.js
//
// A graded Speaking submission: honesty notice (demo stub vs AI examiner),
// overall band, the four criteria with feedback, the student's recording
// (service-role signed URL — private bucket) and the transcript the grade was
// based on. Auth-gated; RLS ensures users only ever see their own grades.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Mic } from 'lucide-react'
import { createServerComponentClientFor, createServiceRoleClient } from '@/lib/supabaseServer'
import { signedAudioUrl, SUBMISSION_AUDIO_BUCKET } from '@/lib/storage/audio'
import {
  BandHighlights, CriteriaBands, GradeFailed, GradeNotice, GradePending, OverallBand,
  SPEAKING_CRITERIA, isStubGrade,
} from '@/components/ielts/BandCriteria'

export const metadata = { title: 'Your Speaking feedback' }

// Per-user, per-submission — never cacheable. Forcing dynamic prevents a
// stale "grading in progress" view if a user lands before the grade commits.
export const dynamic = 'force-dynamic'

export default async function SpeakingResultPage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?redirectTo=/practice/speaking/${params.itemId}/result/${params.submissionId}`)
  }

  const [{ data: submission }, { data: grade }] = await Promise.all([
    supabase
      .from('submissions')
      .select('id, user_id, practice_item_id, payload, status, submitted_at')
      .eq('id', params.submissionId)
      .maybeSingle(),
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
      <div className="container-read py-10">
        <div className="card card-pad text-center">
          <span className="icon-tile mx-auto bg-ink-50 text-ink-500"><Mic className="h-5 w-5" aria-hidden="true" /></span>
          <h1 className="h-section mt-4">We could not find this result</h1>
          <p className="mt-1 text-ink-500">It may belong to another account, or the link is wrong.</p>
          <Link href="/practice" className="btn-primary mt-5">Back to IELTS</Link>
        </div>
      </div>
    )
  }

  const { data: item } = await supabase
    .from('practice_items')
    .select('id, payload, sub_skill, variant')
    .eq('id', submission.practice_item_id)
    .maybeSingle()

  // Sign a short-lived URL for playback (service role — private bucket).
  let playbackUrl = null
  const audioPath = submission.payload?.audio_path
  if (audioPath) {
    try {
      const admin = createServiceRoleClient()
      playbackUrl = await signedAudioUrl(admin, { bucket: SUBMISSION_AUDIO_BUCKET, path: audioPath })
    } catch {
      playbackUrl = null
    }
  }

  const taskHref = `/practice/speaking/${params.itemId}`
  const title = item?.payload?.title || 'Speaking task'
  const stub = isStubGrade(grade)
  const graded = grade && grade.band_overall != null
  const transcript = (grade?.feedback?.transcript ?? '').trim()
  const submittedAt = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="container-read py-6 sm:py-10">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS practice
      </Link>

      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Speaking feedback</p>
      <h1 className="h-page mt-1">{title}</h1>
      {submittedAt ? <p className="mt-1 text-sm text-ink-400">Recorded {submittedAt}</p> : null}

      <div className="mt-6 space-y-6">
        {!grade ? (
          <GradePending href={`${taskHref}/result/${params.submissionId}`} />
        ) : !graded ? (
          <GradeFailed retryHref={taskHref} retryLabel="Record again" />
        ) : (
          <>
            <GradeNotice gradedBy={grade.graded_by} skill="speaking" />
            <OverallBand band={grade.band_overall} sample={stub} />
            {/* Strongest / weakest is a diagnosis — only show it for a real assessment. */}
            {stub ? null : <BandHighlights bands={grade.band_per_criterion} criteria={SPEAKING_CRITERIA} />}

            <section aria-labelledby="criteria-heading">
              <h2 id="criteria-heading" className="h-section">Your four scores</h2>
              <p className="mt-1 text-sm text-ink-500">Examiners mark every speaking test on these four things. Your overall band is their average.</p>
              <div className="mt-3">
                <CriteriaBands bands={grade.band_per_criterion} feedback={grade.feedback?.per_criterion} criteria={SPEAKING_CRITERIA} />
              </div>
            </section>
          </>
        )}

        <section aria-labelledby="recording-heading">
          <h2 id="recording-heading" className="h-section">Your recording</h2>
          {playbackUrl ? (
            <div className="card card-pad mt-3">
              <audio controls preload="metadata" src={playbackUrl} className="w-full">
                Your browser cannot play this recording.
              </audio>
              <p className="mt-2 text-xs text-ink-400">Listen again and compare it with the feedback above.</p>
            </div>
          ) : (
            <p className="card card-pad mt-3 text-sm text-ink-400">
              {audioPath ? 'Your recording could not be loaded right now. Refresh the page to try again.' : 'No recording was saved for this attempt.'}
            </p>
          )}
        </section>

        {graded && transcript ? (
          <section aria-labelledby="transcript-heading">
            <h2 id="transcript-heading" className="h-section">{stub ? 'Sample transcript' : 'What we heard'}</h2>
            <p className="mt-1 text-sm text-ink-500">
              {stub
                ? 'Demo mode: this is a fixed example sentence, not a transcript of your recording.'
                : 'An automatic transcript of your recording. The scores above are based on it, so unclear words can affect them.'}
            </p>
            <blockquote className={`card card-pad mt-3 whitespace-pre-wrap text-[15px] leading-relaxed ${stub ? 'border-dashed text-ink-500' : 'text-ink-700'}`}>
              {transcript}
            </blockquote>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Link href="/practice" className="btn-primary btn-lg">
            <Mic className="h-5 w-5" aria-hidden="true" /> Try another task
          </Link>
          <Link href={taskHref} className="btn-secondary btn-lg">Record this one again</Link>
          <Link href="/practice" className="btn-ghost btn-lg sm:ml-auto">
            Back to IELTS <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}
