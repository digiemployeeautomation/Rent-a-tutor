// app/learn/reading/page.js
//
// The Reading "teach-then-test" path hub. Lists published reading lessons
// (modules) in order with completion status, then a capstone exam card gated
// until every module's drill has a graded submission. Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { READING_EXAM_ITEM_ID, isExamUnlocked } from '@/lib/ielts/reading-modules'

export default async function ReadingPathPage() {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/learn/reading')

  const { data: modules } = await supabase
    .from('skill_lessons')
    .select('slug, title, summary, drill_item_id, position')
    .eq('section', 'reading')
    .eq('status', 'published')
    .order('position', { ascending: true })

  const mods = modules ?? []
  const drillIds = mods.map((m) => m.drill_item_id).filter(Boolean)

  let completedDrillIds = []
  if (drillIds.length > 0) {
    const { data: subs } = await supabase
      .from('submissions')
      .select('practice_item_id, status')
      .eq('user_id', user.id)
      .in('practice_item_id', drillIds)
      .eq('status', 'graded')
    completedDrillIds = [...new Set((subs ?? []).map((s) => s.practice_item_id))]
  }

  const examUnlocked = isExamUnlocked(mods, completedDrillIds)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800">Learn Reading</h1>
      <p className="mt-2 text-gray-500">Work through each lesson and its practice in order, then take the exam.</p>

      {mods.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
          Lessons are coming soon.
        </div>
      ) : (
        <ol className="mt-8 space-y-3">
          {mods.map((m, i) => {
            const done = m.drill_item_id && completedDrillIds.includes(m.drill_item_id)
            return (
              <li key={m.slug}>
                <Link
                  href={`/learn/reading/${m.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <span>
                    <span className="text-xs uppercase tracking-wide text-gray-400">Module {i + 1}</span>
                    <span className="mt-1 block text-base font-semibold text-gray-800">{m.title}</span>
                    {m.summary ? <span className="mt-1 block text-sm text-gray-500">{m.summary}</span> : null}
                  </span>
                  <span className={`shrink-0 text-sm font-semibold ${done ? 'text-green-600' : 'text-gray-300'}`}>
                    {done ? '✓ Done' : 'Start'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-8">
        {examUnlocked ? (
          <Link
            href={`/practice/reading/${READING_EXAM_ITEM_ID}`}
            className="flex items-center justify-between rounded-2xl border-2 border-blue-600 bg-blue-50 p-5"
          >
            <span className="text-base font-semibold text-blue-800">Final exam — full reading set</span>
            <span className="shrink-0 text-sm font-semibold text-blue-700">Start →</span>
          </Link>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 opacity-70">
            <span className="text-base font-semibold text-gray-500">Final exam — full reading set</span>
            <span className="shrink-0 text-sm text-gray-400">Complete all modules to unlock</span>
          </div>
        )}
      </div>
    </main>
  )
}
