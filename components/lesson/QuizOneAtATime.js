'use client'

import { useState, useEffect } from 'react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function QuizOneAtATime({ questions, onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'

  const question = questions[currentIndex]
  const total = questions.length

  function handleSelect(option) {
    if (selectedAnswer !== null) return
    setSelectedAnswer(option)

    // Determine correctness (optimistic — we just record selection; grading is server-side)
    const isCorrect = question.correct_answer
      ? option === question.correct_answer
      : null

    setFeedback(isCorrect === null ? 'selected' : isCorrect ? 'correct' : 'wrong')

    setTimeout(() => {
      const updatedAnswers = [...answers, { questionId: question.id, answer: option }]
      setAnswers(updatedAnswers)

      if (currentIndex + 1 >= total) {
        onSubmit(updatedAnswers)
      } else {
        setCurrentIndex(i => i + 1)
        setSelectedAnswer(null)
        setFeedback(null)
      }
    }, 500)
  }

  const options = Array.isArray(question?.options) ? question.options : ['True', 'False']

  function getButtonStyle(option) {
    if (selectedAnswer === null) {
      return 'border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100'
    }
    if (option === selectedAnswer) {
      if (feedback === 'correct') return 'border-green-500 bg-green-100 text-green-800'
      if (feedback === 'wrong') return 'border-red-500 bg-red-100 text-red-700'
      return 'border-pink-400 bg-pink-50 text-pink-800'
    }
    if (feedback === 'wrong' && option === question.correct_answer) {
      return 'border-green-400 bg-green-50 text-green-700'
    }
    return 'border-gray-100 bg-white text-gray-400 opacity-50'
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-white px-6 py-8">
      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-10">
        {questions.map((_, idx) => {
          const isDone = idx < currentIndex
          const isCurrent = idx === currentIndex
          return (
            <div
              key={idx}
              className={classNames(
                'rounded-full transition-all duration-200',
                isDone
                  ? 'h-2.5 w-2.5 bg-blue-500'
                  : isCurrent
                    ? 'h-3 w-3 border-2 border-blue-500 bg-white'
                    : 'h-2.5 w-2.5 bg-gray-200'
              )}
            />
          )
        })}
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md text-center">
        <p className="text-xl font-semibold text-gray-800 leading-relaxed mb-10">
          {question?.question_text}
        </p>

        {/* Answer buttons */}
        <div className="w-full space-y-3">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={selectedAnswer !== null}
              className={classNames(
                'w-full rounded-2xl border-2 px-6 py-4 text-base font-medium transition-all duration-200',
                getButtonStyle(option)
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
