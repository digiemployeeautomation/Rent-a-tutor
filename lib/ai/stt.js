// lib/ai/stt.js
//
// Speech-to-text client for the Vercel AI Gateway. Reads config from
// process.env at call time (not at module load) so tests can override it
// cleanly. Mirrors lib/ai/gateway.js in shape.
//
// transcribeAudio({ audioBuffer | signedUrl, contentType }) -> { text, meta }
//
// Stub path: when USE_STUB_GRADER=true or no AI_GATEWAY_API_KEY is set, returns
// a canned transcript with no external call so the Speaking flow can be tested
// end-to-end without a gateway key.

const STT_VERSION = 'stt-v1'

// Canned transcript used by the stub path. Long enough to land the stub
// speaking grader in a realistic mid-band range.
const STUB_TRANSCRIPT =
  "Well, that's an interesting question. I would say that I really enjoy spending my " +
  "free time reading books and going for walks in the park near my home. On weekends I " +
  "usually meet up with my friends and we try a new café or restaurant, because I think " +
  "trying different kinds of food is one of the best ways to relax. In the future I hope " +
  "to travel more and learn about other cultures, as I believe that broadens your mind."

function shouldUseStub() {
  const flag = (process.env.USE_STUB_GRADER ?? '').toLowerCase() === 'true'
  return flag || !process.env.AI_GATEWAY_API_KEY
}

// Transcribe an audio recording. Accepts either a raw buffer (Uint8Array /
// ArrayBuffer / Buffer) via `audioBuffer`, or a `signedUrl` the gateway can
// fetch. The real path posts multipart form-data to the gateway's audio
// transcriptions endpoint.
export async function transcribeAudio({ audioBuffer, signedUrl, contentType = 'audio/webm' } = {}) {
  if (shouldUseStub()) {
    return {
      text: STUB_TRANSCRIPT,
      meta: {
        model_version: `stub@${STT_VERSION}`,
        latency_ms: null,
        cost_cents: null,
      },
    }
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY
  const baseUrl = process.env.AI_GATEWAY_BASE_URL || 'https://gateway.ai.vercel.app/v1'
  const model = process.env.AI_GATEWAY_STT_MODEL || 'openai/whisper-1'

  if (!apiKey) {
    throw new Error('AI_GATEWAY_API_KEY is not set')
  }

  // Resolve the audio bytes. If only a signed URL was given, fetch it.
  let bytes = audioBuffer
  if (!bytes) {
    if (!signedUrl) {
      throw new Error('transcribeAudio requires either audioBuffer or signedUrl')
    }
    const audioRes = await fetch(signedUrl)
    if (!audioRes.ok) {
      throw new Error(`Could not fetch audio for transcription: ${audioRes.status}`)
    }
    bytes = await audioRes.arrayBuffer()
  }

  const ext = contentType.includes('mp3') ? 'mp3'
    : contentType.includes('wav') ? 'wav'
    : contentType.includes('mpeg') ? 'mp3'
    : 'webm'

  const form = new FormData()
  form.append('model', model)
  form.append('file', new Blob([bytes], { type: contentType }), `recording.${ext}`)

  const startedAt = Date.now()
  const res = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      // NOTE: do not set Content-Type — FormData sets the multipart boundary.
    },
    body: form,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`AI Gateway STT error ${res.status}: ${errText}`)
  }

  const body = await res.json()
  const text = body?.text
  if (typeof text !== 'string') {
    throw new Error('AI Gateway STT returned no transcript')
  }

  const latency_ms = Date.now() - startedAt

  return {
    text,
    meta: {
      model_version: `${model}@${STT_VERSION}`,
      latency_ms,
      cost_cents: null, // Whisper is priced per audio-minute; not tracked here yet.
    },
  }
}

export const STT_GRADER_VERSION = STT_VERSION
