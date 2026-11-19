// app/practice/listening/[itemId]/result/[submissionId]/page.js
//
// Renders a graded Listening submission. Auth-gated; RLS ensures users only
// ever see their own grades. Delegates rendering to the shared SetResult
// component (deterministic per-question review).
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import SetResult from '@/components/practice/SetResult'
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
      <div className="container-read py-12 sm:py-16">
        <p className="eyebrow !text-copper-700">IELTS Listening</p>
        <h1 className="h-page mt-2">Result not found</h1>
        <p className="lead mt-3">This result does not exist or is not available right now.</p>
        <Link href="/practice" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to IELTS
        </Link>
      </div>
    )
  }

  const transcript = Array.isArray(item?.payload?.transcript) ? item.payload.transcript : []

  return (
    <div className="container-read overflow-x-clip pb-16 pt-4 sm:pt-6">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS
      </Link>

      <div className="mt-3 sm:mt-5">
        <SetResult
          grade={grade}
          eyebrow="IELTS Listening · Your result"
          title={item?.payload?.title || 'Listening set'}
          retryHref={`/practice/listening/${params.itemId}`}
          band={grade?.band_overall ?? null}
          optionLabels={optionLabelsFor(questions)}
        />
      </div>

      {transcript.length > 0 ? (
        <details className="group mt-12 border-y-2 border-ink-900 sm:mt-16">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="h-section block">Read what was said</span>
              <span className="mt-0.5 block text-[15px] leading-snug text-ink-600">The full transcript of the recording.</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[15px] font-bold text-board-700">
              <span className="group-open:hidden">Show</span>
              <span className="hidden group-open:inline">Hide</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
            </span>
          </summary>
          <div className="border-t border-ink-200 pb-6 pt-4">
            <p className="max-w-[62ch] text-[15px] leading-relaxed text-ink-600">
              Check the answers you missed against the recording. Reading along while you listen again is good practice.
            </p>
            <dl className="mt-4 max-w-[62ch] space-y-3.5">
              {transcript.map((turn, i) => (
                <div key={i} className="sm:grid sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-x-4">
                  <dt className="text-[15px] font-bold leading-relaxed text-copper-700">{turn.speaker}</dt>
                  <dd className="text-[17px] leading-[1.6] text-ink-800">{turn.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </details>
      ) : null}
    </div>
  )
}
