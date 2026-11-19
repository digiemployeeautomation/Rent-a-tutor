// app/practice/writing/[itemId]/result/[submissionId]/page.js
//
// A graded Writing submission: overall band, honesty notice (demo sample vs
// AI examiner), the four criteria with feedback, corrections / model answer
// when the AI provides them, and the student's own text. Auth-gated; RLS
// ensures users only ever see their own grades.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import SubjectArt from '@/components/art/SubjectArt'
import {
  BandHighlights, CriteriaBands, GradeFailed, GradeNotice, GradePending, ResultHeader, ResultScale,
  isStubGrade, writingCriteriaFor,
} from '@/components/ielts/BandCriteria'

export const metadata = { title: 'Your Writing feedback' }

// Per-user, per-submission — never cacheable. Forcing dynamic prevents a
// stale "grading in progress" view if a user lands before the grade commits.
export const dynamic = 'force-dynamic'

const EYEBROW = 'IELTS Writing · Your result'

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length
}

function excerpt(text, offset, length) {
  const o = Number(offset)
  const l = Number(length)
  if (!Number.isInteger(o) || !Number.isInteger(l) || o < 0 || l <= 0 || o + l > text.length) return null
  return text.slice(o, o + l)
}

export default async function WritingResultPage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?redirectTo=/practice/writing/${params.itemId}/result/${params.submissionId}`)
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
        <SubjectArt name="writing" tone="copper" className="mx-auto h-24 w-24" />
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

  const taskHref = `/practice/writing/${params.itemId}`
  const responseText = submission.payload?.response_text ?? ''
  const words = countWords(responseText)
  const title = item?.payload?.title || 'Writing task'
  const criteria = writingCriteriaFor(item?.sub_skill)
  const stub = isStubGrade(grade)
  const graded = grade && grade.band_overall != null
  const feedback = grade?.feedback ?? {}
  const corrections = Array.isArray(feedback.corrections)
    ? feedback.corrections
        .map((c) => ({ ...c, quote: excerpt(responseText, c?.offset, c?.length) }))
        .filter((c) => c.issue || c.suggestion)
        .slice(0, 8)
    : []
  const rewrite = typeof feedback.model_rewrite === 'string' ? feedback.model_rewrite.trim() : ''
  const submittedAt = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const essayMeta = `${words} word${words === 1 ? '' : 's'}${submittedAt ? ` · ${submittedAt}` : ''}`

  return (
    <div className="container-read pb-16 pt-6 sm:pt-10">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS practice
      </Link>
      <h1 className="sr-only">Writing result: {title}</h1>

      <div className="mt-3 sm:mt-5">
        {!grade ? (
          <GradePending href={`${taskHref}/result/${params.submissionId}`} eyebrow={EYEBROW} what="essay" />
        ) : !graded ? (
          <GradeFailed retryHref={taskHref} retryLabel="Back to the task" eyebrow={EYEBROW} />
        ) : (
          <>
            <ResultHeader eyebrow={EYEBROW} band={grade.band_overall} sample={stub} meta={title} />
            <GradeNotice gradedBy={grade.graded_by} skill="writing" />
            <ResultScale band={grade.band_overall} />

            <section aria-labelledby="criteria-heading" className="mt-14 sm:mt-16">
              <div className="rule-head">
                <h2 id="criteria-heading" className="h-section">Your four scores</h2>
                <p className="shrink-0 text-[13px] font-semibold text-ink-500">Band, on the 4 to 9 scale</p>
              </div>
              <CriteriaBands bands={grade.band_per_criterion} feedback={feedback.per_criterion} criteria={criteria} />
              <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
                Examiners mark every essay on these four things. Your overall band is their average.
              </p>
            </section>

            {/* Strongest / weakest is a diagnosis: only show it for a real assessment. */}
            {stub ? null : (
              <section aria-label="Summary" className="mt-12">
                <BandHighlights bands={grade.band_per_criterion} criteria={criteria} />
              </section>
            )}

            {corrections.length ? (
              <section aria-labelledby="fix-heading" className="mt-14 sm:mt-16">
                <div className="rule-head">
                  <h2 id="fix-heading" className="h-section">Things to fix</h2>
                </div>
                <ol className="rows">
                  {corrections.map((c, i) => (
                    <li key={i} className="flex gap-4 py-4">
                      <span className="numeral w-6 shrink-0 text-xl leading-7 text-copper-600" aria-hidden="true">{i + 1}</span>
                      <div className="min-w-0">
                        {c.quote ? (
                          <p className="text-[17px] leading-relaxed text-ink-800">
                            <span className="bg-rose-50 px-1 text-rose-700 line-through decoration-rose-300">{c.quote}</span>
                          </p>
                        ) : null}
                        {c.issue ? <p className="mt-1 text-[15px] font-bold text-ink-900">{c.issue}</p> : null}
                        {c.suggestion ? <p className="mt-0.5 text-[15px] leading-relaxed text-board-700">{c.suggestion}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {rewrite ? (
              <section aria-labelledby="rewrite-heading" className="mt-14 sm:mt-16">
                <div className="rule-head">
                  <h2 id="rewrite-heading" className="h-section">A stronger version</h2>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-600">Your essay rewritten about one band higher. Compare it with yours.</p>
                <div className="mt-4 max-w-[62ch] whitespace-pre-wrap break-words text-[17px] leading-[1.7] text-ink-800">{rewrite}</div>
              </section>
            ) : null}
          </>
        )}

        <section aria-labelledby="yours-heading" className="mt-14 sm:mt-16">
          <div className="rule-head">
            <h2 id="yours-heading" className="h-section">Your essay</h2>
            <p className="shrink-0 text-[13px] font-semibold text-ink-500 tabular">{essayMeta}</p>
          </div>
          {responseText.trim() ? (
            <div className="sheet mt-6 whitespace-pre-wrap break-words p-6 text-[17px] leading-[1.7] text-ink-800 sm:p-9">{responseText}</div>
          ) : (
            <p className="mt-4 text-[17px] text-ink-600">No text was submitted.</p>
          )}
        </section>

        {/* A failed grade shows its own actions; while marking, "Check again" is the main one. */}
        {graded ? (
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href={taskHref} className="btn-primary btn-lg">Write this one again</Link>
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
