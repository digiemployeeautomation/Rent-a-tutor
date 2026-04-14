'use client'

import { useState } from 'react'

export default function PersonalityQuiz({ questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])

  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex) / totalQuestions) * 100

  function handleOptionSelect(optionIndex) {
    const newAnswer = { questionId: currentQuestion.id, optionIndex }
    const updatedAnswers = [...answers.slice(0, currentIndex), newAnswer]

    if (currentIndex + 1 < totalQuestions) {
      setAnswers(updatedAnswers)
      setCurrentIndex(currentIndex + 1)
    } else {
      onComplete(updatedAnswers)
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-sm text-gray-500">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-forest-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-gray-800">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-gray-700 transition-colors hover:border-forest-600 hover:bg-sage-200 hover:text-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-2"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Back button */}
      {currentIndex > 0 && (
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
    </div>
  )
}
