// lib/storage/audio.js
//
// Thin Supabase Storage helpers for audio, shared by Listening (item audio,
// produced once at content time) and Speaking (user recordings, uploaded per
// submission). Buckets are private; clients get short-lived signed URLs.
//
// Required buckets (create in Supabase → Storage, both private):
//   - practice-audio   : Listening section audio (read by students)
//   - submission-audio : Speaking recordings (written by students)
//
// These helpers take an explicit Supabase client so callers choose the right
// auth context (service role for content production, user client for the
// student's own uploads under RLS-style path prefixes).

export const PRACTICE_AUDIO_BUCKET = 'practice-audio'
export const SUBMISSION_AUDIO_BUCKET = 'submission-audio'

const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour

// Upload an audio blob/buffer and return its storage path.
export async function uploadAudio(client, { bucket, path, body, contentType = 'audio/mpeg' }) {
  const { error } = await client.storage
    .from(bucket)
    .upload(path, body, { contentType, upsert: true })
  if (error) throw new Error(`Audio upload failed: ${error.message}`)
  return { bucket, path }
}

// Produce a short-lived signed URL for playback.
export async function signedAudioUrl(client, { bucket, path, ttlSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS }) {
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, ttlSeconds)
  if (error) throw new Error(`Could not sign audio URL: ${error.message}`)
  return data.signedUrl
}

// Deterministic storage path for a student's Speaking recording.
export function submissionAudioPath(userId, submissionId, ext = 'webm') {
  return `${userId}/${submissionId}.${ext}`
}
