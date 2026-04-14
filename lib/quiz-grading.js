// lib/quiz-grading.js

/**
 * Grade a quiz submission.
 * Returns { score, maxScore, passed, results }
 * where results is an array of { questionId, correct, correctAnswer, explanation }
 */
export function gradeQuiz(questions, answers, passMark) {
  let score = 0
  let maxScore = 0

  const results = questions.map((q) => {
    const studentAnswer = answers.find(a => a.questionId === q.id)
    maxScore += q.points

    if (!studentAnswer) {
      return {
        questionId: q.id,
        correct: false,
        studentAnswer: null,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        points: 0,
      }
    }

    let correct = false

    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      correct = studentAnswer.answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
    } else if (q.type === 'short_answer') {
      const student = studentAnswer.answer.trim().toLowerCase()
      const expected = q.correct_answer.trim().toLowerCase()
      correct = student === expected
    }

    if (correct) score += q.points

    return {
      questionId: q.id,
      correct,
      studentAnswer: studentAnswer.answer,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      points: correct ? q.points : 0,
    }
  })

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const passed = passMark === 0 ? true : percentage >= passMark

  return { score, maxScore, percentage, passed, results }
}

/**
 * Generate feedback for reflection quiz (Quiz 4).
 * Compares student's description against key points from the lesson.
 * Returns { coveredPoints, missedPoints, feedback }
 */
export function gradeReflection(studentResponse, keyPoints) {
  const responseLower = studentResponse.toLowerCase()

  const coveredPoints = []
  const missedPoints = []

  for (const point of keyPoints) {
    const keywords = point.keywords || []
    const mentioned = keywords.some(kw => responseLower.includes(kw.toLowerCase()))

    if (mentioned) {
      coveredPoints.push(point.description)
    } else {
      missedPoints.push(point.description)
    }
  }

  return {
    coveredPoints,
    missedPoints,
    totalPoints: keyPoints.length,
    coveredCount: coveredPoints.length,
  }
}
