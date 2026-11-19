'use client'
// A real quick-check from "What is a fraction?" (Mathematics, Form 1) that a
// visitor can answer right on the landing page. Text copied from
// content/highschool/mathematics/1-what-is-a-fraction.json.
// Drawn as a paper sheet: it lies on the chalkboard in the hero.
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, RotateCcw, X } from 'lucide-react'

const ITEM = {
  question: 'A farmer in Mumbwa has 45 kg of maize seed. He plants 2/3 of it. How many kilograms does he plant?',
  options: ['15 kg', '67.5 kg', '30 kg', '43 kg'],
  answer: 2,
  explanation:
    'One third of 45 kg is 45 ÷ 3 = 15 kg, so two thirds is 2 × 15 = 30 kg. 15 kg is only one third. 67.5 kg comes from dividing by 2 and multiplying by 3, which is upside down and gives more than he had.',
}
const LETTERS = ['A', 'B', 'C', 'D']
const LESSON_HREF = '/learn/high-school/mathematics/1-what-is-a-fraction'

export default function SampleQuestion({ className = '' }) {
  const [picked, setPicked] = useState(null)
  const [checked, setChecked] = useState(false)
  const correct = checked && picked === ITEM.answer

  function reset() {
    setPicked(null)
    setChecked(false)
  }

  return (
    <div className={`sheet p-5 sm:p-6 ${className}`}>
      <p className="flex items-baseline justify-between gap-3 text-[13px] font-semibold text-ink-500">
        <span>Mathematics · Form 1</span>
        <span>Quick check</span>
      </p>

      <p id="sample-q" className="mt-3 font-display text-[1.1875rem] font-semibold leading-snug text-ink-900 sm:text-[1.3125rem]" style={{ letterSpacing: '-0.015em' }}>
        {ITEM.question}
      </p>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="sample-q">
        {ITEM.options.map((opt, i) => {
          const isPicked = picked === i
          const isRight = i === ITEM.answer
          let row = 'border-ink-300 bg-white hover:border-ink-900'
          let letter = ''
          if (checked && isRight) { row = 'border-board-700 bg-board-50 ring-1 ring-inset ring-board-700'; letter = 'border-board-700 bg-board-700 text-chalk' }
          else if (checked && isPicked) { row = 'border-rose-600 bg-rose-50 ring-1 ring-inset ring-rose-600'; letter = 'border-rose-600 bg-rose-600 text-white' }
          else if (checked) { row = 'border-ink-200 bg-white opacity-55' }
          else if (isPicked) { row = 'border-board-700 bg-board-50 ring-1 ring-inset ring-board-700'; letter = 'border-board-700 bg-board-700 text-chalk' }
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={checked}
              onClick={() => setPicked(i)}
              className={`flex min-h-[52px] w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left disabled:cursor-default ${row}`}
            >
              <span className={`opt-letter ${letter}`}>
                {checked && isRight
                  ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                  : checked && isPicked
                    ? <X className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                    : LETTERS[i]}
              </span>
              <span className="text-base font-semibold text-ink-900 tabular">{opt}</span>
              {checked && isRight ? <span className="ml-auto text-[13px] font-bold text-board-700">Correct</span> : null}
              {checked && isPicked && !isRight ? <span className="ml-auto text-[13px] font-bold text-rose-700">Your answer</span> : null}
            </button>
          )
        })}
      </div>

      {checked ? (
        <div
          role="status"
          className={`mt-4 animate-fade-in-up rounded-lg border px-4 py-3.5 ${correct ? 'border-board-200 bg-board-50' : 'border-sun-300 bg-sun-50'}`}
        >
          <p className={`text-[15px] font-bold ${correct ? 'text-board-800' : 'text-ink-900'}`}>
            {correct ? 'Correct. Well done.' : 'Not quite. The answer is 30 kg.'}
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-700">{ITEM.explanation}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        {checked ? (
          <>
            <Link href={LESSON_HREF} className="btn-secondary group">
              Open the full lesson <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
            </Link>
            <button type="button" onClick={reset} className="btn-ghost">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setChecked(true)} disabled={picked === null} className="btn-dark">
              Check answer
            </button>
            <p className="muted">{picked === null ? 'Pick an answer first.' : 'You will see why straight away.'}</p>
          </>
        )}
      </div>
    </div>
  )
}
