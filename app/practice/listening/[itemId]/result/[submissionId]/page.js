// app/practice/listening/[itemId]/result/[submissionId]/page.js
//
// Renders a graded Listening submission. Auth-gated; RLS ensures users only
// ever see their own grades. Delegates rendering to the shared SetResult
// component (deterministic per-question review).
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import SetResult from '@/components/practice/SetResult'
import SetHeader from '@/components/ielts/SetHeader'
import { optionLabelsFor } from '@/components/ielts/option-labels'

// Per-user, per-submission — never cacheable. Forcing dynamic prevents a
// stale "grading in progress" view if a user lands before the grade commits.
export const dynamic = 'force-dynamic'

export default async function ListeningResultPage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/practice/listening/${params.itemId}/result/${params.submissionId}`)
  }

  const [{ data: submission }, { data: grade }, { data: item }, { data: questions }] = await Promise.all([
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
    supabase
      .from('practice_items')
      .select('id, payload')
      .eq('id', params.itemId)
      .maybeSingle(),
    supabase
      .from('practice_questions')
      .select('id, options')
      .eq('practice_item_id', params.itemId),
  ])

  if (!submission || submission.user_id !== user.id || submission.practice_item_id !== params.itemId) {
    return (
      <div className="container-read py-12">
        <h1 className="h-page">Result not found</h1>
        <p className="lead mt-2">This result does not exist or is not available right now.</p>
        <Link href="/practice" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to IELTS
        </Link>
      </div>
    )
  }

  return (
    <div className="container-read py-6 sm:py-8">
      <SetHeader
        eyebrow="IELTS Listening · Your result"
        title={item?.payload?.title || 'Listening set'}
      />

      <SetResult
        grade={grade}
        retryHref={`/practice/listening/${params.itemId}`}
        band={grade?.band_overall ?? null}
        optionLabels={optionLabelsFor(questions)}
      />

      {Array.isArray(item?.payload?.transcript) && item.payload.transcript.length > 0 ? (
        <details className="card mt-6 overflow-hidden">
          <summary className="flex min-h-[56px] cursor-pointer items-center justify-between gap-3 px-5 py-4 text-[15px] font-semibold text-ink-900 sm:px-6">
            Read what was said (transcript)
            <span className="text-sm font-medium text-teal-700">Show / hide</span>
          </summary>
          <div className="space-y-3 border-t border-ink-100 px-5 py-5 sm:px-6">
            <p className="text-sm text-ink-400">Check the answers you missed against the recording. Reading along while you listen again is good practice.</p>
            {item.payload.transcript.map((turn, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-ink-700">
                <span className="mr-2 text-xs font-bold uppercase tracking-wider text-teal-700">{turn.speaker}</span>
                {turn.text}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  )
}
