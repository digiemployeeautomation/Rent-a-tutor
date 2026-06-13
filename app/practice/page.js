// app/practice/page.js
//
// Practice library index. Lists published practice items grouped by
// type and lets the student start one. Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { labelForType, subSkillLabel, hrefForItem } from '@/lib/ielts/sections'

export default async function PracticeIndexPage() {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/practice')

  const { data: items } = await supabase
    .from('practice_items')
    .select('id, type, sub_skill, variant, difficulty_band, payload')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const groups = (items ?? []).reduce((acc, item) => {
    const key = item.type
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800">Practice library</h1>
      <p className="mt-2 text-gray-500">Pick a task and get instant band-score feedback.</p>

      <Link
        href="/learn/reading"
        className="mt-6 flex items-center justify-between rounded-2xl border-2 border-blue-600 bg-blue-50 px-6 py-4"
      >
        <span>
          <span className="block text-base font-semibold text-blue-800">Learn Reading — step by step</span>
          <span className="mt-0.5 block text-sm text-blue-700">Strategy lessons, guided practice, then a full exam.</span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-blue-700">Start →</span>
      </Link>

      {Object.keys(groups).length === 0 ? (
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-gray-500">No tasks available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {Object.entries(groups).map(([type, list]) => (
            <section key={type}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {labelForType(type)}
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {list.map((item) => {
                  const href = hrefForItem(item)
                  const title = item.payload?.title || subSkillLabel(item.sub_skill)
                  const card = (
                    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400">
                        <span>{subSkillLabel(item.sub_skill)}</span>
                        <span>•</span>
                        <span>Band {Number(item.difficulty_band).toFixed(1)}</span>
                      </div>
                      <div className="mt-2 text-base font-semibold text-gray-800">{title}</div>
                      {item.payload?.prompt ? (
                        <p className="mt-2 line-clamp-3 text-sm text-gray-500">{item.payload.prompt}</p>
                      ) : null}
                      {!href ? (
                        <div className="mt-4 text-xs text-gray-400">Coming soon</div>
                      ) : null}
                    </div>
                  )
                  return href ? (
                    <Link key={item.id} href={href} className="block h-full">
                      {card}
                    </Link>
                  ) : (
                    <div key={item.id} className="opacity-60">{card}</div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
