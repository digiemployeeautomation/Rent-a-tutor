// app/practice/speaking/[itemId]/result/[submissionId]/page.js
//
// A graded Speaking submission: overall band, honesty notice (demo sample vs
// AI examiner), the four criteria with feedback, the student's recording
// (service-role signed URL — private bucket) and the transcript the grade was
// based on. Auth-gated; RLS ensures users only ever see their own grades.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServerComponentClientFor, createServiceRoleClient } from '@/lib/supabaseServer'
import { signedAudioUrl, SUBMISSION_AUDIO_BUCKET } from '@/lib/storage/audio'
import SubjectArt from '@/components/art/SubjectArt'
import ClipPlayer from '@/components/practice/ClipPlayer'
import {
  BandHighlights, CriteriaBands, GradeFailed, GradeNotice, GradePending, ResultHeader, ResultScale,
  SPEAKING_CRITERIA, isStubGrade,
} from '@/components/ielts/BandCriteria'

export const metadata = { title: 'Your Speaking feedback' }

// Per-user, per-submission — never cacheable. Forcing dynamic prevents a
// stale "grading in progress" view if a user lands before the grade commits.
export const dynamic = 'force-dynamic'

const EYEBROW = 'IELTS Speaking · Your result'

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
      <div className="container-read py-16 text-center sm:py-24">
        <SubjectArt name="speaking" tone="copper" className="mx-auto h-24 w-24" />
        <h1 className="h-section mt-6">We could not find this result</h1>
        <p className="mx-auto mt-2 max-w-sm text-[17px] leading-relaxed text-ink-600">It may belong to another account, or the link is wrong.</p>
        <Link href="/practice" className="btn-primary mt-6">Back to IELTS</Link>
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
    <div className="container-read pb-16 pt-6 sm:pt-10">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS practice
      </Link>
      <h1 className="sr-only">Speaking result: {title}</h1>

      <div className="mt-3 sm:mt-5">
        {!grade ? (
          <GradePending href={`${taskHref}/result/${params.submissionId}`} eyebrow={EYEBROW} what="recording" />
        ) : !graded ? (
          <GradeFailed retryHref={taskHref} retryLabel="Record again" eyebrow={EYEBROW} />
        ) : (
          <>
            <ResultHeader eyebrow={EYEBROW} band={grade.band_overall} sample={stub} meta={title} />
            <GradeNotice gradedBy={grade.graded_by} skill="speaking" />
            <ResultScale band={grade.band_overall} />

            <section aria-labelledby="criteria-heading" className="mt-14 sm:mt-16">
              <div className="rule-head">
                <h2 id="criteria-heading" className="h-section">Your four scores</h2>
                <p className="shrink-0 text-[13px] font-semibold text-ink-500">Band, on the 4 to 9 scale</p>
              </div>
              <CriteriaBands bands={grade.band_per_criterion} feedback={grade.feedback?.per_criterion} criteria={SPEAKING_CRITERIA} />
              <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
                Examiners mark every speaking test on these four things. Your overall band is their average.
              </p>
            </section>

            {/* Strongest / weakest is a diagnosis: only show it for a real assessment. */}
            {stub ? null : (
              <section aria-label="Summary" className="mt-12">
                <BandHighlights bands={grade.band_per_criterion} criteria={SPEAKING_CRITERIA} />
              </section>
            )}
          </>
        )}

        <section aria-labelledby="recording-heading" className="mt-14 sm:mt-16">
          <div className="rule-head">
            <h2 id="recording-heading" className="h-section">Your recording</h2>
            {submittedAt ? <p className="shrink-0 text-[13px] font-semibold text-ink-500 tabular">Recorded {submittedAt}</p> : null}
          </div>
          {playbackUrl ? (
            <>
              <ClipPlayer src={playbackUrl} label={title} className="mt-6" />
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">Listen again and compare it with the feedback above.</p>
            </>
          ) : (
            <p className="mt-4 text-[17px] leading-relaxed text-ink-600">
              {audioPath ? 'Your recording could not be loaded right now. Refresh the page to try again.' : 'No recording was saved for this attempt.'}
            </p>
          )}
        </section>

        {graded && transcript ? (
          <section aria-labelledby="transcript-heading" className="mt-14 sm:mt-16">
            <div className="rule-head">
              <h2 id="transcript-heading" className="h-section">{stub ? 'Sample transcript' : 'What we heard'}</h2>
            </div>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink-600">
              {stub
                ? 'Demo mode: this is a fixed example sentence, not a transcript of your recording.'
                : 'An automatic transcript of your recording. The scores above are based on it, so unclear words can affect them.'}
            </p>
            <blockquote className="sheet mt-5 whitespace-pre-wrap break-words p-6 text-[17px] leading-[1.7] text-ink-800 sm:p-9">
              {transcript}
            </blockquote>
          </section>
        ) : null}

        {/* A failed grade shows its own actions; while marking, "Check again" is the main one. */}
        {graded ? (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href={taskHref} className="btn-primary btn-lg">Record this one again</Link>
            <Link href="/practice" className="btn-secondary btn-lg">Back to IELTS</Link>
          </div>
        ) : !grade ? (
          <div className="mt-10">
            <Link href="/practice" className="btn-secondary btn-lg">Back to IELTS</Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
