// app/api/submissions/route.js
//
// POST creates a new submission for a practice item. Returns the new
// submission row. The client then calls POST /api/submissions/:id/grade
// to kick off grading.
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function POST(request) {
  const supabase = createServerClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { practice_item_id, payload } = body
  if (!practice_item_id) {
    return NextResponse.json({ error: 'practice_item_id is required' }, { status: 400 })
  }

  // Confirm the practice item is published
  const { data: item, error: itemErr } = await supabase
    .from('practice_items')
    .select('id, status')
    .eq('id', practice_item_id)
    .single()
  if (itemErr || !item || item.status !== 'published') {
    return NextResponse.json({ error: 'Practice item not available' }, { status: 404 })
  }

  const { data: submission, error: insertErr } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      practice_item_id,
      payload: payload ?? {},
      status: 'pending_grade',
      submitted_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (insertErr) {
    console.error('[submissions] insert error:', insertErr)
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }

  return NextResponse.json({ submission })
}
