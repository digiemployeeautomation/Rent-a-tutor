// app/api/admin/content/route.js
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

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request) {
  const supabase = createServerClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const entity = searchParams.get('entity')

  try {
    if (entity === 'units') {
      const termId = searchParams.get('termId')
      const subjectId = searchParams.get('subjectId')
      let query = supabase.from('units').select('*').order('number', { ascending: true })
      if (termId) query = query.eq('term_id', termId)
      if (subjectId) query = query.eq('subject_id', subjectId)
      const { data, error } = await query
      if (error) throw error
      return NextResponse.json({ data })
    }

    if (entity === 'topics') {
      const unitId = searchParams.get('unitId')
      if (!unitId) return NextResponse.json({ error: 'unitId required' }, { status: 400 })
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('unit_id', unitId)
        .order('order', { ascending: true })
      if (error) throw error
      return NextResponse.json({ data })
    }

    if (entity === 'lessons') {
      const topicId = searchParams.get('topicId')
      if (!topicId) return NextResponse.json({ error: 'topicId required' }, { status: 400 })
      const { data, error } = await supabase
        .from('lessons_new')
        .select('*')
        .eq('topic_id', topicId)
        .order('order', { ascending: true })
      if (error) throw error
      return NextResponse.json({ data })
    }

    if (entity === 'sections') {
      const lessonId = searchParams.get('lessonId')
      if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 })
      const { data, error } = await supabase
        .from('lesson_sections')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order', { ascending: true })
      if (error) throw error
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 })
  } catch (err) {
    console.error('[admin/content GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── POST (insert) ─────────────────────────────────────────────────────────────
export async function POST(request) {
  const supabase = createServerClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { entity, data } = await request.json()
    if (!entity || !data) return NextResponse.json({ error: 'entity and data required' }, { status: 400 })

    const tableMap = {
      units: 'units',
      topics: 'topics',
      lessons: 'lessons_new',
      sections: 'lesson_sections',
    }
    const table = tableMap[entity]
    if (!table) return NextResponse.json({ error: 'Unknown entity' }, { status: 400 })

    const { data: inserted, error } = await supabase.from(table).insert(data).select().single()
    if (error) throw error
    return NextResponse.json({ data: inserted }, { status: 201 })
  } catch (err) {
    console.error('[admin/content POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PUT (update) ──────────────────────────────────────────────────────────────
export async function PUT(request) {
  const supabase = createServerClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { entity, id, data } = await request.json()
    if (!entity || !id || !data) return NextResponse.json({ error: 'entity, id and data required' }, { status: 400 })

    const tableMap = {
      units: 'units',
      topics: 'topics',
      lessons: 'lessons_new',
      sections: 'lesson_sections',
    }
    const table = tableMap[entity]
    if (!table) return NextResponse.json({ error: 'Unknown entity' }, { status: 400 })

    const { data: updated, error } = await supabase.from(table).update(data).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[admin/content PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(request) {
  const supabase = createServerClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { entity, id } = await request.json()
    if (!entity || !id) return NextResponse.json({ error: 'entity and id required' }, { status: 400 })

    const tableMap = {
      units: 'units',
      topics: 'topics',
      lessons: 'lessons_new',
      sections: 'lesson_sections',
    }
    const table = tableMap[entity]
    if (!table) return NextResponse.json({ error: 'Unknown entity' }, { status: 400 })

    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/content DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
