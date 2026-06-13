// app/api/submissions/[id]/grade/route.js
//
// Grades a submission by dispatching to the registered grader for the
// practice item's type (see lib/grading/index.js). The route owns auth,
// ownership, idempotency, persistence, and the error path; each grader owns
// only the scoring logic. Adding a section does not change this file.
import { NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabaseServer'
import { getGrader, errorGradedBy } from '@/lib/grading'

function isStubMode() {
  return (process.env.USE_STUB_GRADER ?? '').toLowerCase() === 'true'
}

export async function POST(_request, { params }) {
  const { id: submissionId } = params
  const supabase = createServerClient()
  // Writes to grades + submission status bypass RLS — only the server
  // grader should be able to set scores. The deterministic grader also reads
  // answer keys (server-only) through this client.
  const admin = createServiceRoleClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Load submission (RLS ensures user owns it)
  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .select('id, user_id, practice_item_id, payload, status')
    .eq('id', submissionId)
    .single()

  if (subErr || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }
  if (submission.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Idempotent: if there's already a grade, return it instead of re-grading.
  const { data: existingGrade } = await supabase
    .from('grades')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingGrade && submission.status === 'graded') {
    return NextResponse.json({ grade: existingGrade })
  }

  // Load the practice item to learn its type
  const { data: item, error: itemErr } = await supabase
    .from('practice_items')
    .select('id, type, sub_skill, variant, payload')
    .eq('id', submission.practice_item_id)
    .single()

  if (itemErr || !item) {
    return NextResponse.json({ error: 'Practice item not found' }, { status: 404 })
  }

  const grader = getGrader(item.type)
  if (!grader) {
    return NextResponse.json(
      { error: `Grading for ${item.type} is not implemented yet` },
      { status: 400 },
    )
  }

  let fields
  try {
    fields = await grader(item, submission, { admin, isStub: isStubMode() })
  } catch (err) {
    console.error('[grade] grading error:', err)
    // Persist an error grade row so we don't lose the attempt.
    await admin.from('grades').insert({
      submission_id: submissionId,
      band_overall: null,
      band_per_criterion: null,
      feedback: { error: err.message || 'Grading failed' },
      graded_by: errorGradedBy(item.type, isStubMode()),
      model_version: 'error',
    })
    await admin
      .from('submissions')
      .update({ status: 'error', submitted_at: new Date().toISOString() })
      .eq('id', submissionId)
    return NextResponse.json({ error: 'Grading failed' }, { status: 500 })
  }

  const { data: gradeRow, error: insertErr } = await admin
    .from('grades')
    .insert({
      submission_id: submissionId,
      band_overall: fields.band_overall,
      band_per_criterion: fields.band_per_criterion,
      feedback: fields.feedback,
      graded_by: fields.graded_by,
      model_version: fields.model_version,
      cost_cents: fields.cost_cents ?? null,
      latency_ms: fields.latency_ms ?? null,
    })
    .select('*')
    .single()

  if (insertErr) {
    console.error('[grade] insert error:', insertErr)
    return NextResponse.json({ error: 'Failed to persist grade' }, { status: 500 })
  }

  await admin
    .from('submissions')
    .update({ status: 'graded', submitted_at: new Date().toISOString() })
    .eq('id', submissionId)

  return NextResponse.json({ grade: gradeRow })
}
