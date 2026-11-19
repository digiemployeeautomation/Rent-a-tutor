// app/practice/reading/[itemId]/result/[submissionId]/page.js
//
// Renders a graded Reading submission. Auth-gated; RLS ensures users only
// ever see their own grades. Delegates rendering to the shared SetResult
// component (deterministic per-question review).
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import SetResult from '@/components/practice/SetResult'
import { optionLabelsFor } from '@/components/ielts/option-labels'
import { nextModule, moduleForDrill } from '@/lib/ielts/reading-modules'

// Per-user, per-submission — never cacheable. Forcing dynamic prevents a
// stale "grading in progress" view if a user lands before the grade commits.
export const dynamic = 'force-dynamic'

export default async function ReadingResultPage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/practice/reading/${params.itemId}/result/${params.submissionId}`)
  }

  const [{ data: submission }, { data: grade }, { data: item }, { data: questions }, { data: modules }] = await Promise.all([
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
    supabase
      .from('skill_lessons')
      .select('slug, title, drill_item_id, position')
      .eq('section', 'reading')
      .eq('status', 'published')
      .order('position', { ascending: true }),
  ])

  if (!submission || submission.user_id !== user.id || submission.practice_item_id !== params.itemId) {
    return (
      <div className="container-read py-12 sm:py-16">
        <p className="eyebrow !text-copper-700">IELTS Reading</p>
        <h1 className="h-page mt-2">Result not found</h1>
        <p className="lead mt-3">This result does not exist or is not available right now.</p>
        <Link href="/practice" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to IELTS
        </Link>
      </div>
    )
  }

  const retryHref = `/practice/reading/${params.itemId}`
  const mods = modules ?? []
  const isDrill = !!moduleForDrill(mods, params.itemId)
  const next = isDrill ? nextModule(mods, params.itemId) : null
  const title = item?.payload?.title || 'Reading set'
  const isMock = item?.payload?.is_mock === true

  return (
    <div className="container-read overflow-x-clip pb-16 pt-4 sm:pt-6">
      <Link
        href={isDrill ? '/learn/reading' : '/practice'}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {isDrill ? 'Reading path' : 'IELTS'}
      </Link>

      <div className="mt-3 sm:mt-5">
        <SetResult
          grade={grade}
          eyebrow={isMock ? 'IELTS Reading · Mock exam result' : 'IELTS Reading · Your result'}
          title={title}
          retryHref={retryHref}
          pathHref={isDrill ? '/learn/reading' : undefined}
          nextHref={next ? `/learn/reading/${next.slug}` : undefined}
          nextLabel={next ? next.title : undefined}
          band={grade?.band_overall ?? null}
          bandVariant={grade?.feedback?.band_variant ?? null}
          timeTakenSeconds={submission.payload?.time_taken_seconds ?? null}
          timedOut={submission.payload?.timed_out ?? false}
          optionLabels={optionLabelsFor(questions)}
        />
      </div>
    </div>
  )
}
