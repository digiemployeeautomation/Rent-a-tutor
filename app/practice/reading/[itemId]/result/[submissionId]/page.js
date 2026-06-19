// app/practice/reading/[itemId]/result/[submissionId]/page.js
//
// Renders a graded Reading submission. Auth-gated; RLS ensures users only
// ever see their own grades. Delegates rendering to the shared SetResult
// component (deterministic per-question review).
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import SetResult from '@/components/practice/SetResult'
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

  const backHref = `/practice/reading/${params.itemId}`

  const { data: modules } = await supabase
    .from('skill_lessons')
    .select('slug, title, drill_item_id, position')
    .eq('section', 'reading')
    .eq('status', 'published')
    .order('position', { ascending: true })

  const mods = modules ?? []
  const isDrill = !!moduleForDrill(mods, params.itemId)
  const next = isDrill ? nextModule(mods, params.itemId) : null
  const pathHref = isDrill ? '/learn/reading' : undefined
  const nextHref = next ? `/learn/reading/${next.slug}` : undefined
  const nextLabel = next ? next.title : undefined

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href={backHref} className="text-xs text-gray-400 hover:text-gray-600">
        ← Back to set
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-800">Reading results</h1>

      <SetResult
        grade={grade}
        retryHref={backHref}
        pathHref={pathHref}
        nextHref={nextHref}
        nextLabel={nextLabel}
        title="Your raw score"
        band={grade?.band_overall ?? null}
        bandVariant={grade?.feedback?.band_variant ?? null}
        timeTakenSeconds={submission?.payload?.time_taken_seconds ?? null}
        timedOut={submission?.payload?.timed_out ?? false}
      />
    </main>
  )
}
