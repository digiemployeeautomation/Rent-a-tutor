// app/api/admin/quiz-questions/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403 }
  return { user }
}

// ── GET — fetch questions for a quiz ─────────────────────────────────────────
export async function GET(request) {
  const supabase = createServerClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const quizId = searchParams.get('quizId')
  if (!quizId) return NextResponse.json({ error: 'quizId required' }, { status: 400 })

  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[admin/quiz-questions GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── POST — bulk insert questions for a quiz ───────────────────────────────────
export async function POST(request) {
  const supabase = createServerClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { quizId, questions } = await request.json()
    if (!quizId || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'quizId and questions array required' }, { status: 400 })
    }

    const rows = questions.map((q, i) => ({
      quiz_id: quizId,
      type: q.type,
      question_text: q.question_text,
      options: q.options ?? null,
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? null,
      points: q.points ?? 1,
      order: q.order ?? i + 1,
    }))

    const { data, error } = await supabase.from('quiz_questions').insert(rows).select()
    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('[admin/quiz-questions POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PUT — update a single question ───────────────────────────────────────────
export async function PUT(request) {
  const supabase = createServerClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { id, data } = await request.json()
    if (!id || !data) return NextResponse.json({ error: 'id and data required' }, { status: 400 })

    const { data: updated, error } = await supabase
      .from('quiz_questions')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[admin/quiz-questions PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── DELETE — remove a question ────────────────────────────────────────────────
export async function DELETE(request) {
  const supabase = createServerClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase.from('quiz_questions').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/quiz-questions DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
