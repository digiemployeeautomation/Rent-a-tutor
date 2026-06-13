// lib/ai/speaking-gateway.js
//
// Thin client for the Vercel AI Gateway, specialised for Speaking grading.
// Reads config from process.env at call time (not at module load) so tests
// can override it cleanly. Mirrors lib/ai/gateway.js (Writing).
//
// Exposes gradeSpeaking({ part, taskPrompt, transcript }) -> { grade, meta }.
// Returns the same JSON shape as the stub speaking grader, so the grader can
// pick either path interchangeably.

import fs from 'node:fs'
import path from 'node:path'

const PROMPT_VERSION = 'speaking-grader-v1'

function loadPromptTemplate() {
  const filePath = path.join(process.cwd(), 'lib', 'content', 'prompts', `${PROMPT_VERSION}.md`)
  return fs.readFileSync(filePath, 'utf8')
}

function fillPrompt(template, params) {
  return template
    .replace('{{PART}}', params.part ?? 'speaking-part-1')
    .replace('{{TASK_PROMPT}}', params.taskPrompt ?? '')
    .replace('{{TRANSCRIPT}}', params.transcript ?? '')
}

export async function gradeSpeaking({ part, taskPrompt, transcript }) {
  const apiKey = process.env.AI_GATEWAY_API_KEY
  const baseUrl = process.env.AI_GATEWAY_BASE_URL || 'https://gateway.ai.vercel.app/v1'
  const model = process.env.AI_GATEWAY_SPEAKING_MODEL || 'anthropic/claude-sonnet-4-6'

  if (!apiKey) {
    throw new Error('AI_GATEWAY_API_KEY is not set')
  }

  const template = loadPromptTemplate()
  const prompt = fillPrompt(template, { part, taskPrompt, transcript })

  const startedAt = Date.now()
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      // Some providers require explicit response_format to enforce JSON only.
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`AI Gateway error ${res.status}: ${errText}`)
  }

  const body = await res.json()
  const text = body?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('AI Gateway returned no content')
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    throw new Error(`AI Gateway returned non-JSON output: ${text.slice(0, 200)}`)
  }

  // Reject malformed-but-valid JSON (missing band_overall, criteria as strings,
  // etc.) before it can be persisted as a junk grade row that renders as NaN.
  // Throwing here drops into the grade route's error path, which records a
  // proper error grade instead.
  validateSpeakingGrade(parsed)

  const latency_ms = Date.now() - startedAt
  const cost_cents = estimateCostCents(body.usage)

  return {
    grade: parsed,
    meta: {
      model_version: `${model}@${PROMPT_VERSION}`,
      latency_ms,
      cost_cents,
    },
  }
}

// The four official Speaking criteria keys the prompt (speaking-grader-v1.md)
// instructs the model to return. Must stay in sync with that prompt + the stub.
export const SPEAKING_CRITERIA = ['fluency', 'lexical', 'grammar', 'pronunciation']

function isBand(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 9
}

// Validates the model's parsed grade against the expected grade-row shape.
// Throws (with a specific reason) on any deviation so the caller never persists
// a partial/NaN grade. Returns the grade unchanged when valid.
export function validateSpeakingGrade(grade) {
  if (!grade || typeof grade !== 'object' || Array.isArray(grade)) {
    throw new Error('Speaking grade is not a JSON object')
  }
  if (!isBand(grade.band_overall)) {
    throw new Error(`Speaking grade band_overall is not a band in [0,9]: ${JSON.stringify(grade.band_overall)}`)
  }
  const bands = grade.band_per_criterion
  if (!bands || typeof bands !== 'object' || Array.isArray(bands)) {
    throw new Error('Speaking grade band_per_criterion is missing or not an object')
  }
  for (const c of SPEAKING_CRITERIA) {
    if (!isBand(bands[c])) {
      throw new Error(`Speaking grade band_per_criterion.${c} is not a band in [0,9]: ${JSON.stringify(bands[c])}`)
    }
  }
  if (!grade.feedback || typeof grade.feedback !== 'object' || Array.isArray(grade.feedback)) {
    throw new Error('Speaking grade feedback is missing or not an object')
  }
  return grade
}

// Rough cost estimator. Replace with real per-model pricing when wiring
// production tokens — for now, prices in $/1M tokens for Claude Sonnet 4.6.
const PROMPT_USD_PER_M = 3.0
const COMPLETION_USD_PER_M = 15.0

function estimateCostCents(usage) {
  if (!usage) return null
  const promptTokens     = usage.prompt_tokens     ?? 0
  const completionTokens = usage.completion_tokens ?? 0
  const usd =
    (promptTokens / 1_000_000) * PROMPT_USD_PER_M +
    (completionTokens / 1_000_000) * COMPLETION_USD_PER_M
  return Math.round(usd * 100)
}

export const SPEAKING_GRADER_VERSION = PROMPT_VERSION
