// lib/ielts/answer-grading.js
//
// Deterministic grading core shared by Reading and Listening. Pure
// functions, no I/O — the grader route reads questions (with answer keys)
// via the service role and feeds them here.
//
// answer_key shapes by primitive (stored in practice_questions.answer_key):
//   single_select : { value: "B" }
//   multi_select  : { values: ["A","C"], required: 2 }
//   text_fill     : { accepted: ["20", "twenty"], word_limit: 2 }
//
// Submission answers are keyed by question id:
//   single_select : "B"
//   multi_select  : ["A","C"]
//   text_fill     : "twenty"

import { primitiveFor } from './question-types.js'

// Normalize free text for comparison: trim, lowercase, collapse internal
// whitespace, strip surrounding punctuation. Spelling still matters (IELTS
// penalizes misspellings) so we do NOT do fuzzy matching — accepted spelling
// variants live in the answer key's `accepted` list.
export function normalizeText(s) {
  if (s == null) return ''
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[\s"'.,;:!?()]+|[\s"'.,;:!?()]+$/g, '')
}

function countWords(s) {
  const n = normalizeText(s)
  if (!n) return 0
  return n.split(' ').filter(Boolean).length
}

export function gradeSingleSelect(userAnswer, answerKey) {
  const expected = normalizeText(answerKey?.value)
  const got = normalizeText(userAnswer)
  const correct = got !== '' && got === expected
  return { correct, marks: correct ? 1 : 0, maxMarks: 1, correctAnswer: answerKey?.value ?? null }
}

export function gradeTextFill(userAnswer, answerKey) {
  const accepted = Array.isArray(answerKey?.accepted) ? answerKey.accepted : []
  const wordLimit = answerKey?.word_limit ?? null
  const got = normalizeText(userAnswer)

  let correct = got !== '' && accepted.some((a) => normalizeText(a) === got)
  // Enforce the "NO MORE THAN N WORDS" rule — over-length answers are wrong
  // even if they contain the right words.
  if (correct && wordLimit != null && countWords(userAnswer) > wordLimit) {
    correct = false
  }
  return {
    correct,
    marks: correct ? 1 : 0,
    maxMarks: 1,
    correctAnswer: accepted[0] ?? null,
  }
}

export function gradeMultiSelect(userAnswers, answerKey) {
  const keyValues = (Array.isArray(answerKey?.values) ? answerKey.values : []).map(normalizeText)
  const required = answerKey?.required ?? keyValues.length
  const picks = Array.isArray(userAnswers) ? userAnswers.map(normalizeText) : []

  // One mark per correct selection. To stop a student from selecting every
  // option to guarantee the marks, credit is only given while the number of
  // selections does not exceed `required`; extra picks earn nothing.
  const uniquePicks = [...new Set(picks)]
  const honoredPicks = uniquePicks.slice(0, required)
  const correctCount = honoredPicks.filter((p) => keyValues.includes(p)).length

  return {
    correct: correctCount === required,
    marks: correctCount,
    maxMarks: required,
    correctAnswer: answerKey?.values ?? null,
  }
}

// Grade a single question by dispatching on its primitive.
export function gradeQuestion(question, userAnswer) {
  const primitive = primitiveFor(question.question_type)
  switch (primitive) {
    case 'single_select': return gradeSingleSelect(userAnswer, question.answer_key)
    case 'multi_select':  return gradeMultiSelect(userAnswer, question.answer_key)
    case 'text_fill':     return gradeTextFill(userAnswer, question.answer_key)
    default:
      // Unknown type → ungradable; counts as 0/1 so totals stay honest.
      return { correct: false, marks: 0, maxMarks: 1, correctAnswer: null }
  }
}

// Grade a whole Reading/Listening set. `questions` is the array of
// practice_questions rows (with answer_key); `answersById` maps question id
// → the student's answer. Returns a per-question review plus the raw score.
export function gradeReadingSet(questions, answersById = {}) {
  const perQuestion = questions
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((q) => {
      const userAnswer = answersById[q.id]
      const result = gradeQuestion(q, userAnswer)
      return {
        question_id: q.id,
        position: q.position,
        prompt: q.prompt,
        question_type: q.question_type,
        explanation: q.explanation ?? null,
        your_answer: userAnswer ?? null,
        correct_answer: result.correctAnswer,
        correct: result.correct,
        marks: result.marks,
        max_marks: result.maxMarks,
      }
    })

  const rawScore = perQuestion.reduce((sum, q) => sum + q.marks, 0)
  const total = perQuestion.reduce((sum, q) => sum + q.max_marks, 0)
  const percentage = total > 0 ? Math.round((rawScore / total) * 100) : 0

  return { perQuestion, rawScore, total, percentage }
}
