// lib/grading/deterministic.js
//
// Deterministic grader for Reading and Listening sets. Reads the questions
// (WITH answer keys) via the service-role client — answer keys are not
// readable by the authenticated user (migration 006) so grading must happen
// server-side here.
//
// Per the scoring decision, a single set reports raw score + per-question
// review only; band conversion is a full-40-question mock-test concern, so
// band_overall is left null here.

import { gradeReadingSet } from '@/lib/ielts/answer-grading'

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

  return {
    band_overall: null, // single set → raw score only; band needs a full mock
    band_per_criterion: null,
    feedback: {
      per_question: perQuestion,
      raw_score: rawScore,
      total,
      percentage,
    },
    graded_by: 'deterministic',
    model_version: DETERMINISTIC_GRADER_VERSION,
    cost_cents: 0,
    latency_ms: null,
  }
}
