// lib/grading/speaking.js
//
// Speaking grader (STT + AI). Extracted from the grade route so the route is
// a thin dispatcher and each item type owns its grading logic. Returns the
// normalized grade-row fields the route persists. Mirrors lib/grading/writing.js.
//
// Pipeline: load the recorded audio (service role) -> transcribe (STT) ->
// LLM-grade the transcript against the Speaking rubric.
//
// ── FUTURE VERCEL WORKFLOW SEAM ─────────────────────────────────────────────
// Today this runs synchronously inside the POST /grade route. STT + LLM can be
// slow, so this is the natural place to move into a durable Vercel Workflow:
// the two awaits below (transcribeAudio, then gradeSpeaking) become two
// workflow steps with retries, and the grade route enqueues the workflow and
// stamps submissions.workflow_id (column already exists in migration 003)
// instead of awaiting the result inline. The result page already polls for a
// grade row, so moving to async requires no UI change — only this function and
// the route's await/persist boundary.
// ────────────────────────────────────────────────────────────────────────────

import { stubGradeSpeaking } from '@/lib/ai/stub-speaking-grader'
import { transcribeAudio, STT_GRADER_VERSION } from '@/lib/ai/stt'
import { gradeSpeaking, SPEAKING_GRADER_VERSION } from '@/lib/ai/speaking-gateway'
import { signedAudioUrl, SUBMISSION_AUDIO_BUCKET } from '@/lib/storage/audio'

export async function gradeSpeakingSubmission(item, submission, { admin, isStub } = {}) {
  const part = item.sub_skill
  const taskPrompt = item.payload?.prompt ?? ''
  const audioPath = submission.payload?.audio_path

  if (!audioPath) {
    throw new Error('No audio recording found for this submission (payload.audio_path is missing).')
  }

  // 1) Transcribe. In stub mode we skip the audio entirely (canned transcript);
  //    otherwise sign a short-lived URL via the service-role client and let the
  //    STT client fetch + transcribe it.
  let transcript
  let sttMeta = { model_version: `stub@${STT_GRADER_VERSION}`, latency_ms: null, cost_cents: null }
  if (isStub) {
    const stt = await transcribeAudio({}) // stub path ignores args
    transcript = stt.text
    sttMeta = stt.meta
  } else {
    const url = await signedAudioUrl(admin, {
      bucket: SUBMISSION_AUDIO_BUCKET,
      path: audioPath,
    })
    const stt = await transcribeAudio({ signedUrl: url, contentType: 'audio/webm' })
    transcript = stt.text
    sttMeta = stt.meta
  }

  // 2) Grade the transcript.
  if (isStub) {
    const grade = stubGradeSpeaking({ part, taskPrompt, transcript })
    return {
      band_overall: grade.band_overall,
      band_per_criterion: grade.band_per_criterion,
      feedback: {
        per_criterion: grade.feedback,
        transcript,
        stt_model_version: sttMeta.model_version,
      },
      graded_by: 'stub',
      model_version: `stub@${SPEAKING_GRADER_VERSION}`,
      cost_cents: null,
      latency_ms: null,
    }
  }

  const { grade, meta } = await gradeSpeaking({ part, taskPrompt, transcript })
  return {
    band_overall: grade.band_overall,
    band_per_criterion: grade.band_per_criterion,
    feedback: {
      per_criterion: grade.feedback,
      transcript,
      stt_model_version: sttMeta.model_version,
    },
    graded_by: 'auto-stt-llm',
    model_version: meta.model_version,
    cost_cents: meta.cost_cents,
    latency_ms: (meta.latency_ms ?? 0) + (sttMeta.latency_ms ?? 0),
  }
}
