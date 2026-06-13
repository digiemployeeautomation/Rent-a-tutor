// app/api/submissions/[id]/audio/route.js
//
// POST uploads a Speaking recording for a submission and patches the
// submission payload with the storage path. Auth + ownership are checked via
// the user-scoped client (RLS); the upload itself goes through the service
// role so the student does not need Storage write RLS on the private
// submission-audio bucket.
//
// Request body: the raw audio bytes (the recorded Blob). The client POSTs the
// recording directly with `body: blob` and `Content-Type: audio/webm`; this
// route reads `request.arrayBuffer()`. No multipart wrapping.
import { NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabaseServer'
import {
  uploadAudio,
  submissionAudioPath,
  SUBMISSION_AUDIO_BUCKET,
} from '@/lib/storage/audio'

export async function POST(request, { params }) {
  const { id: submissionId } = params
  const supabase = createServerClient()
  const admin = createServiceRoleClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Load submission (RLS ensures the user owns it).
  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .select('id, user_id, practice_item_id, payload')
    .eq('id', submissionId)
    .single()

  if (subErr || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }
  if (submission.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Only speaking submissions carry audio. Reject other item types so a
  // non-speaking submission can't accumulate orphaned audio in the private
  // bucket.
  const { data: item, error: itemErr } = await supabase
    .from('practice_items')
    .select('id, type')
    .eq('id', submission.practice_item_id)
    .single()

  if (itemErr || !item) {
    return NextResponse.json({ error: 'Practice item not found' }, { status: 404 })
  }
  if (item.type !== 'speaking_task') {
    return NextResponse.json(
      { error: 'Audio upload is only valid for speaking tasks' },
      { status: 400 },
    )
  }

  // Read the raw audio bytes from the request body.
  const contentType = request.headers.get('content-type') || 'audio/webm'
  let buffer
  try {
    const arrayBuffer = await request.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } catch {
    return NextResponse.json({ error: 'Could not read audio body' }, { status: 400 })
  }
  if (!buffer || buffer.length === 0) {
    return NextResponse.json({ error: 'Empty audio upload' }, { status: 400 })
  }

  const audioPath = submissionAudioPath(user.id, submissionId, 'webm')

  try {
    await uploadAudio(admin, {
      bucket: SUBMISSION_AUDIO_BUCKET,
      path: audioPath,
      body: buffer,
      contentType,
    })
  } catch (err) {
    console.error('[audio] upload error:', err)
    return NextResponse.json({ error: 'Failed to store audio' }, { status: 500 })
  }

  // Merge into the existing payload — don't clobber other keys.
  const nextPayload = { ...(submission.payload ?? {}), audio_path: audioPath }
  const { error: patchErr } = await admin
    .from('submissions')
    .update({ payload: nextPayload })
    .eq('id', submissionId)

  if (patchErr) {
    console.error('[audio] payload patch error:', patchErr)
    return NextResponse.json({ error: 'Failed to record audio path' }, { status: 500 })
  }

  return NextResponse.json({ audio_path: audioPath })
}
