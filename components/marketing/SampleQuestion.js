'use client'
// A real quick-check from "What is a fraction?" (Mathematics, Form 1) that a
// visitor can answer right on the landing page. Text copied from
// content/highschool/mathematics/1-what-is-a-fraction.json.
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, CheckCircle2, Lightbulb, RotateCcw, X } from 'lucide-react'

const ITEM = {
  question: 'A farmer in Mumbwa has 45 kg of maize seed. He plants 2/3 of it. How many kilograms does he plant?',
  options: ['15 kg', '67.5 kg', '30 kg', '43 kg'],
  answer: 2,
  explanation:
    'One third of 45 kg is 45 ÷ 3 = 15 kg, so two thirds is 2 × 15 = 30 kg. 15 kg is only one third. 67.5 kg comes from dividing by 2 and multiplying by 3, which is upside down and gives more than he had.',
}
const LETTERS = ['A', 'B', 'C', 'D']
const LESSON_HREF = '/learn/high-school/mathematics/1-what-is-a-fraction'

export default function SampleQuestion() {
  const [picked, setPicked] = useState(null)
  const [checked, setChecked] = useState(false)
  const correct = checked && picked === ITEM.answer

  function reset() {
    setPicked(null)
    setChecked(false)
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5 sm:px-6">
        <span className="chip-blue">Mathematics · Form 1</span>
        <span className="text-xs font-medium text-ink-400">Quick check</span>
      </div>

      <div className="p-5 sm:p-6">
        <p id="sample-q" className="font-display text-lg font-semibold leading-snug text-ink-900 sm:text-xl">
          {ITEM.question}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="sample-q">
          {ITEM.options.map((opt, i) => {
            const isPicked = picked === i
            const isRight = i === ITEM.answer
            let tone = 'border-ink-200 bg-white hover:border-blue-400 hover:bg-blue-50/40'
            let badge = 'bg-ink-100 text-ink-600'
            if (checked && isRight) { tone = 'border-emerald-500 bg-emerald-50'; badge = 'bg-emerald-600 text-white' }
            else if (checked && isPicked) { tone = 'border-rose-400 bg-rose-50'; badge = 'bg-rose-500 text-white' }
            else if (checked) { tone = 'border-ink-100 bg-white opacity-60' }
            else if (isPicked) { tone = 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'; badge = 'bg-blue-600 text-white' }
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={isPicked}
                disabled={checked}
                onClick={() => setPicked(i)}
                className={`flex min-h-[56px] w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left text-[16px] text-ink-800 transition-all disabled:cursor-default disabled:opacity-100 ${tone}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${badge}`}>
                  {checked && isRight ? <Check className="h-4 w-4" aria-hidden="true" /> : checked && isPicked ? <X className="h-4 w-4" aria-hidden="true" /> : LETTERS[i]}
                </span>
                <span className="font-medium">{opt}</span>
              </button>
            )
          })}
        </div>

        {checked ? (
          <div
            role="status"
            className={`mt-5 flex gap-3 rounded-2xl border p-4 animate-fade-in-up ${correct ? 'border-emerald-200 bg-emerald-50' : 'border-sun-200 bg-sun-50'}`}
          >
            {correct
              ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              : <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-sun-600" aria-hidden="true" />}
            <div>
              <p className={`text-sm font-bold ${correct ? 'text-emerald-800' : 'text-ink-900'}`}>
                {correct ? 'Correct — well done.' : 'Not quite. The answer is 30 kg.'}
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-700">{ITEM.explanation}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          {checked ? (
            <>
              <Link href={LESSON_HREF} className="btn-primary">
                Open the full lesson <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button type="button" onClick={reset} className="btn-ghost">
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setChecked(true)} disabled={picked === null} className="btn-primary">
                Check answer
              </button>
              <p className="muted">{picked === null ? 'Pick an answer first.' : 'You will see why straight away.'}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
