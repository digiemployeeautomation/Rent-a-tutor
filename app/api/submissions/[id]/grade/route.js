// app/api/submissions/[id]/grade/route.js
//
// Grades a writing submission. Reads the submission, picks the stub or
// live grader based on USE_STUB_GRADER, persists a grade row, and updates
// the submission status. Returns the grade JSON.
//
// For the demo this only handles writing_task. Speaking and L/R will get
// their own grader paths.
import { NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabaseServer'
import { stubGradeWriting } from '@/lib/ai/stub-grader'
import { gradeWriting, WRITING_GRADER_VERSION } from '@/lib/ai/gateway'

function isStubMode() {
  return (process.env.USE_STUB_GRADER ?? '').toLowerCase() === 'true'
}

export async function POST(_request, { params }) {
  const { id: submissionId } = params
  const supabase = createServerClient()
  // Writes to grades + submission status bypass RLS — only the server
  // grader should be able to set band scores.
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

  // Load the practice item to learn task type + prompt
  const { data: item, error: itemErr } = await supabase
    .from('practice_items')
    .select('id, type, sub_skill, variant, payload')
    .eq('id', submission.practice_item_id)
    .single()

  if (itemErr || !item) {
    return NextResponse.json({ error: 'Practice item not found' }, { status: 404 })
  }
  if (item.type !== 'writing_task') {
    return NextResponse.json({ error: `Grading for ${item.type} is not implemented yet` }, { status: 400 })
  }

  const taskPrompt   = item.payload?.prompt ?? ''
  const responseText = submission.payload?.response_text ?? ''

  let gradePayload
  let gradedBy
  let modelVersion
  let costCents = null
  let latencyMs = null

  try {
    if (isStubMode()) {
      gradePayload = stubGradeWriting({ taskType: item.sub_skill, taskPrompt, responseText })
      gradedBy = 'stub'
      modelVersion = `stub@${WRITING_GRADER_VERSION}`
    } else {
      const { grade, meta } = await gradeWriting({
        taskType: item.sub_skill,
        variant: item.variant,
        taskPrompt,
        responseText,
      })
      gradePayload = grade
      gradedBy = 'auto-llm'
      modelVersion = meta.model_version
      costCents = meta.cost_cents
      latencyMs = meta.latency_ms
    }
  } catch (err) {
    console.error('[grade] grading error:', err)
    // Persist an error grade row so we don't lose the attempt.
    await admin.from('grades').insert({
      submission_id: submissionId,
      band_overall: null,
      band_per_criterion: null,
      feedback: { error: err.message || 'Grading failed' },
      graded_by: isStubMode() ? 'stub' : 'auto-llm',
      model_version: WRITING_GRADER_VERSION,
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
      band_overall: gradePayload.band_overall,
      band_per_criterion: gradePayload.band_per_criterion,
      feedback: {
        per_criterion: gradePayload.feedback,
        corrections: gradePayload.corrections,
        model_rewrite: gradePayload.model_rewrite,
      },
      graded_by: gradedBy,
      model_version: modelVersion,
      cost_cents: costCents,
      latency_ms: latencyMs,
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
