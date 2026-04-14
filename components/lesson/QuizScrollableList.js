'use client'

import { useState } from 'react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function MCOptions({ question, selected, onChange, result, showExplanations }) {
  const options = Array.isArray(question.options) ? question.options : []
  return (
    <div className="space-y-2 mt-3">
      {options.map((option, idx) => {
        const isSelected = selected === option
        const isCorrect = result?.correct_answer === option
        const isWrong = result && isSelected && !result.is_correct

        return (
          <button
            key={idx}
            onClick={() => !result && onChange(option)}
            disabled={!!result}
            className={classNames(
              'w-full rounded-xl border-2 px-4 py-2.5 text-left text-sm transition-colors',
              result
                ? isCorrect
                  ? 'border-green-400 bg-green-50 text-green-800'
                  : isWrong
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-gray-100 bg-white text-gray-400 opacity-60'
                : isSelected
                  ? 'border-pink-400 bg-pink-50 text-pink-800 font-medium'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
            )}
          >
            <span className="flex items-center gap-2">
              {result && isCorrect && (
                <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {result && isWrong && (
                <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {option}
            </span>
          </button>
        )
      })}
      {result && showExplanations && result.explanation && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-800 mt-1">
          <span className="font-semibold">Explanation: </span>
          {result.explanation}
        </div>
      )}
    </div>
  )
}

function TFOptions({ question, selected, onChange, result, showExplanations }) {
  return (
    <div className="flex gap-3 mt-3">
      {['True', 'False'].map(option => {
        const isSelected = selected === option
        const isCorrect = result?.correct_answer === option
        const isWrong = result && isSelected && !result.is_correct

        return (
          <button
            key={option}
            onClick={() => !result && onChange(option)}
            disabled={!!result}
            className={classNames(
              'flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors',
              result
                ? isCorrect
                  ? 'border-green-400 bg-green-50 text-green-800'
                  : isWrong
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-gray-100 bg-white text-gray-400 opacity-60'
                : isSelected
                  ? 'border-pink-400 bg-pink-50 text-pink-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
            )}
          >
            {option}
          </button>
        )
      })}
      {result && showExplanations && result.explanation && (
        <div className="w-full rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-800">
          <span className="font-semibold">Explanation: </span>
          {result.explanation}
        </div>
      )}
    </div>
  )
}

function ShortAnswerInput({ question, value, onChange, result }) {
  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={value ?? ''}
        onChange={e => !result && onChange(e.target.value)}
        disabled={!!result}
        rows={3}
        placeholder="Type your answer here…"
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none disabled:bg-gray-50 disabled:text-gray-500"
      />
      {result && (
        <div className={classNames(
          'rounded-xl px-3 py-2.5 text-xs border',
          result.is_correct ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'
        )}>
          {result.is_correct ? 'Correct!' : `Correct answer: ${result.correct_answer}`}
          {result.explanation && <p className="mt-1 text-gray-600">{result.explanation}</p>}
        </div>
      )}
    </div>
  )
}

export default function QuizScrollableList({ questions, onSubmit, results, showExplanations }) {
  const [answers, setAnswers] = useState({})

  function setAnswer(questionId, value) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  function handleSubmit() {
    const answersArray = questions.map(q => ({
      questionId: q.id,
      answer: answers[q.id] ?? '',
    }))
    onSubmit(answersArray)
  }

  return (
    <div className="space-y-4 pb-6">
      {questions.map((q, idx) => {
        const result = results?.find(r => r.questionId === q.id) ?? null
        const isCorrect = result?.is_correct
        const isWrong = result && !result.is_correct

        return (
          <div
            key={q.id}
            className={classNames(
              'rounded-2xl border-2 bg-white p-5 transition-colors',
              result
                ? isCorrect
                  ? 'border-green-300'
                  : 'border-red-300'
                : 'border-gray-200'
            )}
          >
            <div className="flex items-start gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Q{idx + 1}
              </span>
              {result && (
                <span className={classNames(
                  'ml-auto flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center',
                  isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                )}>
                  {isCorrect ? (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-gray-800 leading-relaxed">
              {q.question_text}
            </p>

            {q.type === 'true_false' ? (
              <TFOptions
                question={q}
                selected={answers[q.id]}
                onChange={val => setAnswer(q.id, val)}
                result={result}
                showExplanations={showExplanations}
              />
            ) : q.type === 'short_answer' ? (
              <ShortAnswerInput
                question={q}
                value={answers[q.id]}
                onChange={val => setAnswer(q.id, val)}
                result={result}
              />
            ) : (
              <MCOptions
                question={q}
                selected={answers[q.id]}
                onChange={val => setAnswer(q.id, val)}
                result={result}
                showExplanations={showExplanations}
              />
            )}
          </div>
        )
      })}

      {!results && (
        <button
          onClick={handleSubmit}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Submit answers
        </button>
      )}
    </div>
  )
}
