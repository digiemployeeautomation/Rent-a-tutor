// lib/ai/stub-speaking-grader.js
//
// Deterministic stub grader for Speaking, used when USE_STUB_GRADER=true or
// when no AI Gateway key is configured. No external calls, no cost,
// predictable output. Mirrors stub-grader.js (Writing) but scores a
// transcript against the four Speaking criteria.
//
// The "band" derived from transcript length is a crude monotonic proxy:
// longer transcripts get higher bands, capped at 7.5 and floored at 4.0.
// Per-criterion bands jitter ±0.5 around the overall band to look real.

const MIN_BAND = 4.0
const MAX_BAND = 7.5

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function roundHalf(n) {
  return Math.round(n * 2) / 2
}

export function stubGradeSpeaking({ part, taskPrompt, transcript }) {
  const text = (transcript || '').trim()
  if (text.length === 0) {
    return {
      band_overall: 0.0,
      band_per_criterion: {
        fluency: 0.0,
        lexical: 0.0,
        grammar: 0.0,
        pronunciation: 0.0,
      },
      feedback: {
        fluency: 'No speech detected in the recording.',
        lexical: 'No speech detected in the recording.',
        grammar: 'No speech detected in the recording.',
        pronunciation: 'No speech detected in the recording.',
      },
    }
  }

  const words = text.split(/\s+/).filter(Boolean).length
  // Map word count → band: 20 words ≈ 4.0, 220 words ≈ 7.5 (linear, then clamp).
  // Speaking responses are shorter than Writing, so the band ramps faster.
  const raw = MIN_BAND + ((words - 20) / (220 - 20)) * (MAX_BAND - MIN_BAND)
  const overall = roundHalf(clamp(raw, MIN_BAND, MAX_BAND))

  const jitter = (key) => {
    // Deterministic small jitter from a hash of the key.
    let h = 0
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) | 0
    // h can be negative (int32 overflow); normalise to [0,3) before deriving delta.
    const bucket = ((h % 3) + 3) % 3 // 0, 1, or 2
    const delta = (bucket - 1) * 0.5 // -0.5, 0, or +0.5
    return roundHalf(clamp(overall + delta, MIN_BAND, MAX_BAND))
  }

  return {
    band_overall: overall,
    band_per_criterion: {
      fluency:       jitter('fluency'),
      lexical:       jitter('lexical'),
      grammar:       jitter('grammar'),
      pronunciation: jitter('pronunciation'),
    },
    feedback: {
      fluency:       `You spoke at a reasonable pace. ${words < 40 ? 'Your answer was quite short — extend each response with reasons and examples. ' : ''}Reduce hesitation and avoid long pauses to improve flow.`,
      lexical:       'You used some accurate vocabulary. Bring in more topic-specific words and natural collocations, and paraphrase rather than repeat the question.',
      grammar:       'Your sentence structures are mostly accurate. Use a wider range of tenses and at least a few complex sentences (although, because, which).',
      pronunciation: 'Your pronunciation is generally understandable. Work on word stress and intonation so key words stand out and meaning is clear.',
    },
  }
}
