import { describe, it, expect } from 'vitest'
import { gradeDeterministicSubmission } from '../deterministic.js'

// Fake of the service-role client's query chain that HONORS the select column
// list (projects each row to only the requested columns). This makes the test
// genuinely fail until the grader's select string includes `explanation`:
// admin.from('practice_questions').select(cols).eq(...).order(...) -> { data, error }
function fakeAdmin(questions) {
  return {
    from() {
      return {
        select(cols) {
          const fields = cols.split(',').map((c) => c.trim())
          const project = (q) => Object.fromEntries(
            fields.filter((f) => f in q).map((f) => [f, q[f]]),
          )
          return {
            eq() {
              return {
                order: async () => ({ data: questions.map(project), error: null }),
              }
            },
          }
        },
      }
    },
  }
}

describe('gradeDeterministicSubmission', () => {
  it('returns per-question explanations in feedback', async () => {
    const questions = [
      {
        id: 'q1', position: 1, prompt: 'x', question_type: 'tfng',
        answer_key: { value: 'TRUE' },
        explanation: { rationale: 'because' },
      },
    ]
    const item = { id: 'item1' }
    const submission = { payload: { answers: { q1: 'TRUE' } } }

    const fields = await gradeDeterministicSubmission(item, submission, { admin: fakeAdmin(questions) })

    expect(fields.feedback.per_question[0].explanation).toEqual({ rationale: 'because' })
    expect(fields.feedback.raw_score).toBe(1)
    expect(fields.band_overall).toBeNull()
  })
})
