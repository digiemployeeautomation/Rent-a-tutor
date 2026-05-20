// app/practice/writing/[itemId]/page.js
//
// Server component that loads a Writing practice item and renders the
// submission form. Auth-gated via the server-side Supabase client.
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'
import SubmissionForm from './SubmissionForm'

export default async function WritingPracticePage({ params }) {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/practice/writing/${params.itemId}`)
  }

  const { data: item, error } = await supabase
    .from('practice_items')
    .select('id, type, sub_skill, variant, payload, status')
    .eq('id', params.itemId)
    .single()

  if (error || !item || item.status !== 'published' || item.type !== 'writing_task') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-800">Practice item not found</h1>
        <p className="mt-2 text-gray-500">
          This task does not exist or is not available right now.
        </p>
      </main>
    )
  }

  const payload = item.payload ?? {}
  const subSkillLabel = subSkillToLabel(item.sub_skill)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
        <span>{subSkillLabel}</span>
        <span>•</span>
        <span>{variantLabel(item.variant)}</span>
        {payload.time_limit_minutes ? (<><span>•</span><span>{payload.time_limit_minutes} min</span></>) : null}
        {payload.minimum_words ? (<><span>•</span><span>min {payload.minimum_words} words</span></>) : null}
      </div>

      <h1 className="text-3xl font-bold text-gray-800">{payload.title || 'Writing task'}</h1>

      <div className="mt-6 whitespace-pre-line rounded-2xl bg-blue-50 p-6 text-sm text-gray-800">
        {payload.prompt}
      </div>

      <div className="mt-8">
        <SubmissionForm
          itemId={item.id}
          minimumWords={payload.minimum_words ?? 250}
        />
      </div>
    </main>
  )
}

function subSkillToLabel(s) {
  switch (s) {
    case 'writing-task-1-academic': return 'Writing Task 1 (Academic)'
    case 'writing-task-1-general':  return 'Writing Task 1 (General)'
    case 'writing-task-2':          return 'Writing Task 2'
    default: return 'Writing'
  }
}
function variantLabel(v) {
  if (v === 'academic') return 'Academic'
  if (v === 'general')  return 'General Training'
  return 'Academic & General'
}
