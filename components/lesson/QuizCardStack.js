'use client'

import { useState } from 'react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function QuizCardStack({ questions, onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [slideOut, setSlideOut] = useState(false)

  const question = questions[currentIndex]
  const total = questions.length
  const options = Array.isArray(question?.options) ? question.options : ['True', 'False']

  function handleSelect(option) {
    if (selectedAnswer !== null || slideOut) return
    setSelectedAnswer(option)

    setTimeout(() => {
      setSlideOut(true)

      setTimeout(() => {
        const updatedAnswers = [...answers, { questionId: question.id, answer: option }]
        setAnswers(updatedAnswers)

        if (currentIndex + 1 >= total) {
          onSubmit(updatedAnswers)
          return
        }

        setCurrentIndex(i => i + 1)
        setSelectedAnswer(null)
        setSlideOut(false)
      }, 300)
    }, 400)
  }

  function getButtonStyle(option) {
    if (selectedAnswer === null) {
      return 'border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50'
    }
    if (option === selectedAnswer) {
      return 'border-pink-400 bg-pink-50 text-pink-800'
    }
    return 'border-gray-100 bg-white text-gray-400 opacity-40'
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 py-6">
      {/* Counter */}
      <div className="flex justify-end mb-4">
        <span className="text-sm font-semibold text-gray-500">
          {currentIndex + 1}/{total}
        </span>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div
          className={classNames(
            'w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-8 mb-6 transition-all duration-300',
            slideOut ? 'opacity-0 -translate-x-8' : 'opacity-100 translate-x-0'
          )}
          style={{ transform: slideOut ? 'translateX(-48px)' : 'translateX(0)', opacity: slideOut ? 0 : 1 }}
        >
          <p className="text-lg font-semibold text-gray-800 leading-relaxed text-center">
            {question?.question_text}
          </p>
        </div>

        {/* Answer buttons */}
        <div className="w-full max-w-md space-y-3">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={selectedAnswer !== null}
              className={classNames(
                'w-full rounded-xl border-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 text-left',
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
