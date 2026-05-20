// lib/ai/gateway.js
//
// Thin client for the Vercel AI Gateway. Reads config from process.env at
// call time (not at module load) so tests can override it cleanly.
//
// Exposes one function: gradeWriting({ taskType, taskPrompt, responseText }).
// Returns the same JSON shape as the stub grader, so the route handler
// can pick either grader interchangeably.

import fs from 'node:fs'
import path from 'node:path'

const PROMPT_VERSION = 'writing-grader-v1'

function loadPromptTemplate() {
  const filePath = path.join(process.cwd(), 'lib', 'content', 'prompts', `${PROMPT_VERSION}.md`)
  return fs.readFileSync(filePath, 'utf8')
}

function fillPrompt(template, params) {
  return template
    .replace('{{TASK_TYPE}}', params.taskType)
    .replace('{{VARIANT}}', params.variant ?? 'both')
    .replace('{{TASK_PROMPT}}', params.taskPrompt)
    .replace('{{RESPONSE_TEXT}}', params.responseText)
}

export async function gradeWriting({ taskType, variant, taskPrompt, responseText }) {
  const apiKey = process.env.AI_GATEWAY_API_KEY
  const baseUrl = process.env.AI_GATEWAY_BASE_URL || 'https://gateway.ai.vercel.app/v1'
  const model = process.env.AI_GATEWAY_WRITING_MODEL || 'anthropic/claude-sonnet-4-6'

  if (!apiKey) {
    throw new Error('AI_GATEWAY_API_KEY is not set')
  }

  const template = loadPromptTemplate()
  const prompt = fillPrompt(template, { taskType, variant, taskPrompt, responseText })

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

// Rough cost estimator. Replace with real per-model pricing when wiring
// production tokens — for now, prices in $/1M tokens for Claude Sonnet 4.6
// at writing time of the gateway integration.
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

export const WRITING_GRADER_VERSION = PROMPT_VERSION
