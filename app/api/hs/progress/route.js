// app/api/hs/progress/route.js
//
// GET  -> { items: { [lessonId]: { score, total, passed, completedAt } } } for the signed-in student
// POST -> { lessonId, score, total } saves the result, keeping the best score
// Guests get 401; the client then falls back to localStorage.
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { PASS_MARK } from '@/lib/highschool/subjects'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not signed in' }, { status: 401 })

  const { data, error } = await supabase
    .from('hs_lesson_progress')
    .select('lesson_id, score, total, passed, completed_at')
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = {}
  for (const r of data ?? []) {
    items[r.lesson_id] = { score: r.score, total: r.total, passed: r.passed, completedAt: r.completed_at }
  }
  return NextResponse.json({ items })
}

export async function POST(request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not signed in' }, { status: 401 })

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }
  const lessonId = String(body.lessonId || '').slice(0, 120)
  const score = Number(body.score)
  const total = Number(body.total)
  if (!/^[a-z0-9-]+$/.test(lessonId) || !Number.isInteger(score) || !Number.isInteger(total) || total < 1 || total > 50 || score < 0 || score > total) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('hs_lesson_progress')
    .select('score, attempts')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const best = Math.max(score, existing?.score ?? 0)
  const row = {
    user_id: user.id,
    lesson_id: lessonId,
    score: best,
    total,
    passed: best / total >= PASS_MARK,
    attempts: (existing?.attempts ?? 0) + 1,
    completed_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('hs_lesson_progress').upsert(row, { onConflict: 'user_id,lesson_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, ...row })
}
