// lib/grading/deterministic.js
//
// Deterministic grader for Reading and Listening sets. Reads the questions
// (WITH answer keys) via the service-role client — answer keys are not
// readable by the authenticated user (migration 006) so grading must happen
// server-side here.
//
// Per the scoring decision, a single drill reports raw score + per-question
// review only. A mock set (payload.is_mock) additionally reports an estimated
// band via the official raw→band tables (lib/ielts/banding).

import { gradeReadingSet } from '@/lib/ielts/answer-grading'
import { estimateReadingBand } from '@/lib/ielts/banding'

export const DETERMINISTIC_GRADER_VERSION = 'deterministic-v1'

export async function gradeDeterministicSubmission(item, submission, { admin } = {}) {
  if (!admin) throw new Error('deterministic grader requires a service-role client')

  const { data: questions, error } = await admin
    .from('practice_questions')
    .select('id, position, prompt, question_type, answer_key, explanation')
    .eq('practice_item_id', item.id)
    .order('position', { ascending: true })

  if (error) throw new Error(`Failed to load questions: ${error.message}`)
  if (!questions || questions.length === 0) {
    throw new Error('Practice item has no questions to grade')
  }

  const answersById = submission.payload?.answers ?? {}
  const { perQuestion, rawScore, total, percentage } = gradeReadingSet(questions, answersById)

  // A drill reports raw score only; a mock also reports an estimated band.
  const isMock = item.payload?.is_mock === true
  const variant = item.variant === 'general' ? 'general' : 'academic'
  const band = isMock ? estimateReadingBand(rawScore, total, variant) : null

  const feedback = {
    per_question: perQuestion,
    raw_score: rawScore,
    total,
    percentage,
  }
  if (isMock) feedback.band_variant = variant

  return {
    band_overall: band,
    band_per_criterion: null,
    feedback,
    graded_by: 'deterministic',
    model_version: DETERMINISTIC_GRADER_VERSION,
    cost_cents: 0,
    latency_ms: null,
  }
}
