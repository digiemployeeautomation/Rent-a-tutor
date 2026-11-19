// app/practice/writing/[itemId]/result/[submissionId]/page.js
//
// A graded Writing submission: honesty notice (demo stub vs AI examiner),
// overall band, the four criteria with feedback, corrections / model answer
// when the AI provides them, and the student's own text. Auth-gated; RLS
// ensures users only ever see their own grades.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, FileText, PenLine, Sparkles } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import {
  BandHighlights, CriteriaBands, GradeFailed, GradeNotice, GradePending, OverallBand,
  WRITING_CRITERIA, isStubGrade,
} from '@/components/ielts/BandCriteria'

export const metadata = { title: 'Your Writing feedback' }

// Per-user, per-submission — never cacheable. Forcing dynamic prevents a
// stale "grading in progress" view if a user lands before the grade commits.
export const dynamic = 'force-dynamic'

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
      <div className="container-read py-10">
        <div className="card card-pad text-center">
          <span className="icon-tile mx-auto bg-ink-50 text-ink-500"><FileText className="h-5 w-5" aria-hidden="true" /></span>
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

  const taskHref = `/practice/writing/${params.itemId}`
  const responseText = submission.payload?.response_text ?? ''
  const words = countWords(responseText)
  const title = item?.payload?.title || 'Writing task'
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

  return (
    <div className="container-read py-6 sm:py-10">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS practice
      </Link>

      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Writing feedback</p>
      <h1 className="h-page mt-1">{title}</h1>
      <p className="mt-1 text-sm text-ink-400">
        {words} words{submittedAt ? ` · submitted ${submittedAt}` : ''}
      </p>

      <div className="mt-6 space-y-6">
        {!grade ? (
          <GradePending href={`${taskHref}/result/${params.submissionId}`} />
        ) : !graded ? (
          <GradeFailed retryHref={taskHref} retryLabel="Back to the task" />
        ) : (
          <>
            <GradeNotice gradedBy={grade.graded_by} skill="writing" />
            <OverallBand band={grade.band_overall} sample={stub} />
            {/* Strongest / weakest is a diagnosis — only show it for a real assessment. */}
            {stub ? null : <BandHighlights bands={grade.band_per_criterion} criteria={WRITING_CRITERIA} />}

            <section aria-labelledby="criteria-heading">
              <h2 id="criteria-heading" className="h-section">Your four scores</h2>
              <p className="mt-1 text-sm text-ink-500">Examiners mark every essay on these four things. Your overall band is their average.</p>
              <div className="mt-3">
                <CriteriaBands bands={grade.band_per_criterion} feedback={feedback.per_criterion} criteria={WRITING_CRITERIA} />
              </div>
            </section>

            {corrections.length ? (
              <section aria-labelledby="fix-heading">
                <h2 id="fix-heading" className="h-section">Things to fix</h2>
                <ul className="card mt-3 divide-y divide-ink-100">
                  {corrections.map((c, i) => (
                    <li key={i} className="px-5 py-4 sm:px-6">
                      {c.quote ? (
                        <p className="text-[15px] text-ink-800">
                          <span className="rounded bg-rose-50 px-1 text-rose-800 line-through decoration-rose-300">{c.quote}</span>
                        </p>
                      ) : null}
                      {c.issue ? <p className="mt-1 text-sm font-semibold text-ink-700">{c.issue}</p> : null}
                      {c.suggestion ? <p className="mt-0.5 text-sm text-emerald-700">{c.suggestion}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {rewrite ? (
              <section aria-labelledby="rewrite-heading">
                <h2 id="rewrite-heading" className="h-section flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sun-500" aria-hidden="true" /> A stronger version
                </h2>
                <p className="mt-1 text-sm text-ink-500">Your essay rewritten about one band higher. Compare it with yours.</p>
                <div className="card card-pad mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-700">{rewrite}</div>
              </section>
            ) : null}
          </>
        )}

        <section aria-labelledby="yours-heading">
          <h2 id="yours-heading" className="h-section">Your essay</h2>
          {responseText.trim() ? (
            <div className="card card-pad mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink-700">{responseText}</div>
          ) : (
            <p className="card card-pad mt-3 text-sm text-ink-400">No text was submitted.</p>
          )}
        </section>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Link href="/practice" className="btn-primary btn-lg">
            <PenLine className="h-5 w-5" aria-hidden="true" /> Try another task
          </Link>
          <Link href={taskHref} className="btn-secondary btn-lg">Write this one again</Link>
          <Link href="/practice" className="btn-ghost btn-lg sm:ml-auto">
            Back to IELTS <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}
