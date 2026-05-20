// lib/ai/stub-grader.js
//
// Deterministic stub grader used when USE_STUB_GRADER=true.
// No external calls, no cost, predictable output. Lets the practice flow
// be tested end-to-end without an AI Gateway key.
//
// The "band" derived from response length is a crude monotonic proxy:
// longer responses get higher bands, capped at 7.5 and floored at 4.0.
// Per-criterion bands jitter ±0.5 around the overall band to look real.

const MIN_BAND = 4.0
const MAX_BAND = 7.5

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function roundHalf(n) {
  return Math.round(n * 2) / 2
}

export function stubGradeWriting({ taskType, taskPrompt, responseText }) {
  const text = (responseText || '').trim()
  if (text.length === 0) {
    return {
      band_overall: 0.0,
      band_per_criterion: {
        task_response: 0.0,
        coherence: 0.0,
        lexical: 0.0,
        grammar: 0.0,
      },
      feedback: {
        task_response: 'No response submitted.',
        coherence: 'No response submitted.',
        lexical: 'No response submitted.',
        grammar: 'No response submitted.',
      },
      corrections: [],
      model_rewrite: '',
    }
  }

  const words = text.split(/\s+/).filter(Boolean).length
  // Map word count → band: 50 words ≈ 4.0, 350 words ≈ 7.5 (linear, then clamp).
  const raw = MIN_BAND + ((words - 50) / (350 - 50)) * (MAX_BAND - MIN_BAND)
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
      task_response: jitter('task_response'),
      coherence:     jitter('coherence'),
      lexical:       jitter('lexical'),
      grammar:       jitter('grammar'),
    },
    feedback: {
      task_response: `Your response addressed the task. ${words < 150 ? 'It is shorter than the required minimum — aim for 250 words on Task 2 and 150 on Task 1. ' : ''}Develop your position with two or three specific examples.`,
      coherence:     'Paragraphing is reasonable. Use a wider range of cohesive devices (however, in contrast, by comparison) to link ideas.',
      lexical:       'You used some accurate vocabulary. Push for more topic-specific terms and avoid repetition of common words.',
      grammar:       'Sentence structures are mostly accurate. Try at least two complex sentences with subordinating conjunctions (although, while, because).',
    },
    corrections: [],
    model_rewrite: '',
  }
}
