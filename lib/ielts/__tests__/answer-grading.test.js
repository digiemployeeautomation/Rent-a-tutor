import { describe, it, expect } from 'vitest'
import {
  normalizeText,
  gradeSingleSelect,
  gradeMultiSelect,
  gradeTextFill,
  gradeQuestion,
  gradeReadingSet,
} from '../answer-grading.js'

describe('normalizeText', () => {
  it('trims, lowercases, collapses whitespace, strips edge punctuation', () => {
    expect(normalizeText('  The   Answer. ')).toBe('the answer')
    expect(normalizeText('"YES"')).toBe('yes')
    expect(normalizeText(null)).toBe('')
  })
})

describe('gradeSingleSelect', () => {
  it('matches case-insensitively', () => {
    expect(gradeSingleSelect('true', { value: 'TRUE' }).correct).toBe(true)
    expect(gradeSingleSelect('B', { value: 'B' }).correct).toBe(true)
  })
  it('marks wrong and empty answers incorrect', () => {
    expect(gradeSingleSelect('A', { value: 'B' }).correct).toBe(false)
    expect(gradeSingleSelect('', { value: 'B' }).correct).toBe(false)
    expect(gradeSingleSelect(undefined, { value: 'B' }).correct).toBe(false)
  })
})

describe('gradeTextFill', () => {
  it('accepts any listed spelling/synonym', () => {
    const key = { accepted: ['20', 'twenty'], word_limit: 2 }
    expect(gradeTextFill('twenty', key).correct).toBe(true)
    expect(gradeTextFill('20', key).correct).toBe(true)
    expect(gradeTextFill('  Twenty ', key).correct).toBe(true)
  })
  it('rejects wrong answers and enforces the word limit', () => {
    const key = { accepted: ['climate change'], word_limit: 2 }
    expect(gradeTextFill('global warming', key).correct).toBe(false)
    expect(gradeTextFill('rapid climate change', key).correct).toBe(false) // 3 words > limit
    expect(gradeTextFill('climate change', key).correct).toBe(true)
  })
})

describe('gradeMultiSelect', () => {
  const key = { values: ['A', 'C'], required: 2 }
  it('full marks for the exact correct set, order-independent', () => {
    const r = gradeMultiSelect(['C', 'A'], key)
    expect(r).toMatchObject({ correct: true, marks: 2, maxMarks: 2 })
  })
  it('partial marks for one right one wrong', () => {
    const r = gradeMultiSelect(['A', 'B'], key)
    expect(r).toMatchObject({ correct: false, marks: 1, maxMarks: 2 })
  })
  it('does not reward over-selecting beyond the required count', () => {
    const r = gradeMultiSelect(['A', 'B', 'C', 'D'], key)
    expect(r.marks).toBeLessThanOrEqual(2)
    expect(r.correct).toBe(false)
  })
})

describe('gradeQuestion dispatches by primitive', () => {
  it('routes tfng to single_select', () => {
    const q = { question_type: 'tfng', answer_key: { value: 'NOT GIVEN' } }
    expect(gradeQuestion(q, 'not given').correct).toBe(true)
  })
  it('routes sentence_completion to text_fill', () => {
    const q = { question_type: 'sentence_completion', answer_key: { accepted: ['river'], word_limit: 1 } }
    expect(gradeQuestion(q, 'river').correct).toBe(true)
  })
  it('unknown type is ungradable (0/1)', () => {
    const q = { question_type: 'mystery', answer_key: {} }
    expect(gradeQuestion(q, 'x')).toMatchObject({ correct: false, marks: 0, maxMarks: 1 })
  })
})

describe('gradeReadingSet', () => {
  const questions = [
    { id: 'q1', position: 1, prompt: 'Q1', question_type: 'tfng', answer_key: { value: 'TRUE' } },
    { id: 'q2', position: 2, prompt: 'Q2', question_type: 'short_answer', answer_key: { accepted: ['rome'], word_limit: 1 } },
    { id: 'q3', position: 3, prompt: 'Q3', question_type: 'mcq_multi', answer_key: { values: ['A', 'B'], required: 2 } },
  ]
  it('tallies raw score and total across mixed primitives', () => {
    const result = gradeReadingSet(questions, { q1: 'TRUE', q2: 'Paris', q3: ['A', 'B'] })
    // q1 correct (1), q2 wrong (0), q3 full (2) → 3 of 4
    expect(result.rawScore).toBe(3)
    expect(result.total).toBe(4)
    expect(result.percentage).toBe(75)
    expect(result.perQuestion).toHaveLength(3)
    expect(result.perQuestion[0]).toMatchObject({ question_id: 'q1', correct: true })
  })
  it('orders the review by position', () => {
    const shuffled = [questions[2], questions[0], questions[1]]
    const result = gradeReadingSet(shuffled, {})
    expect(result.perQuestion.map((q) => q.position)).toEqual([1, 2, 3])
  })
})

describe('gradeReadingSet explanation passthrough', () => {
  it('includes each question explanation in per_question', () => {
    const questions = [
      {
        id: 'q1',
        position: 1,
        prompt: 'The statement is supported.',
        question_type: 'tfng',
        answer_key: { value: 'TRUE' },
        explanation: { rationale: 'Para A states it directly.', evidence: 'Para A: "..."' },
      },
    ]
    const { perQuestion } = gradeReadingSet(questions, { q1: 'TRUE' })
    expect(perQuestion[0].explanation).toEqual({
      rationale: 'Para A states it directly.',
      evidence: 'Para A: "..."',
    })
  })

  it('uses null when a question has no explanation', () => {
    const questions = [
      { id: 'q1', position: 1, prompt: 'x', question_type: 'tfng', answer_key: { value: 'TRUE' } },
    ]
    const { perQuestion } = gradeReadingSet(questions, { q1: 'TRUE' })
    expect(perQuestion[0].explanation).toBeNull()
  })
})
