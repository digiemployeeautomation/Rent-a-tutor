// app/practice/reading/[itemId]/page.js
//
// Server component that loads a Reading set and renders the passage plus the
// shared QuestionSetRunner. Auth-gated via the server-side Supabase client;
// the server-only columns (answer_key, explanation) are never selected here —
// client-readable columns only.
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { subSkillLabel } from '@/lib/ielts/sections'
import QuestionSetRunner from '@/components/practice/QuestionSetRunner'

export default async function ReadingPracticePage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/practice/reading/${params.itemId}`)
  }

  const { data: item, error } = await supabase
    .from('practice_items')
    .select('id, type, sub_skill, variant, payload, status')
    .eq('id', params.itemId)
    .single()

  if (error || !item || item.status !== 'published' || item.type !== 'reading_set') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-800">Practice set not found</h1>
        <p className="mt-2 text-gray-500">
          This reading set does not exist or is not available right now.
        </p>
      </main>
    )
  }

  const { data: questions } = await supabase
    .from('practice_questions')
    .select('id, position, prompt, question_type, options')
    .eq('practice_item_id', item.id)
    .order('position', { ascending: true })

  const payload = item.payload ?? {}

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
        <span>{subSkillLabel(item.sub_skill)}</span>
        <span>•</span>
        <span>{variantLabel(item.variant)}</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-800">{payload.title || 'Reading set'}</h1>

      {payload.passage ? (
        <article className="mt-6 whitespace-pre-line rounded-2xl border border-gray-200 bg-white p-6 text-sm leading-relaxed text-gray-800">
          {payload.passage}
        </article>
      ) : null}

      <div className="mt-10">
        <QuestionSetRunner
          item={item}
          questions={questions ?? []}
          resultBase={`/practice/reading/${item.id}/result`}
        />
      </div>
    </main>
  )
}

function variantLabel(v) {
  if (v === 'academic') return 'Academic'
  if (v === 'general') return 'General Training'
  return 'Academic & General'
}
