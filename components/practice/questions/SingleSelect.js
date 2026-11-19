'use client'
// components/practice/questions/SingleSelect.js
//
// Primitive: pick exactly one option. Covers MCQ-single, True/False/Not
// Given, Yes/No/Not Given, and all matching types. `options` is resolved by
// the caller (item payload options, or the registry's fixedOptions).
// Options are bordered rows with the letter in a ring, like an exam paper.
// `compact` lays short fixed options (TRUE / FALSE / NOT GIVEN) out in a row
// of three; the chosen one is filled in.
//
// Contract: { question, options: [{value,label}|string], value, onChange, compact }
import QuestionPrompt from '@/components/practice/questions/QuestionPrompt'
import { splitOption } from '@/components/ielts/option-labels'

const FOCUS = 'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-board-600'

export default function SingleSelect({ question, options = [], value, onChange, compact = false }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <fieldset className="min-w-0">
      <legend className="w-full">
        <QuestionPrompt question={question} answered={value != null && value !== ''} />
      </legend>
      <div className={`mt-3 grid gap-2 pl-10 ${compact ? 'grid-cols-3' : ''}`}>
        {opts.map((opt, i) => {
          const checked = value === opt.value
          const input = (
            <input
              type="radio"
              name={`q-${question.id}`}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
          )
          if (compact) {
            return (
              <label
                key={opt.value}
                className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg border px-1.5 text-center text-sm font-bold leading-tight transition-colors duration-150 ${FOCUS} ${
                  checked
                    ? 'border-board-700 bg-board-700 text-chalk'
                    : 'border-ink-300 bg-white text-ink-800 hover:border-ink-900'
                }`}
              >
                {input}
                {opt.label}
              </label>
            )
          }
          const { letter, text } = splitOption(opt, i)
          return (
            <label
              key={opt.value}
              className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-base leading-snug transition-colors duration-150 ${FOCUS} ${
                checked
                  ? 'border-board-700 bg-board-50 text-ink-900'
                  : 'border-ink-300 bg-white text-ink-800 hover:border-ink-900'
              }`}
            >
              {input}
              <span
                className={`opt-letter !w-auto min-w-[1.75rem] px-1.5 ${checked ? '!border-board-700 !bg-board-700 !text-chalk' : ''}`}
                aria-hidden={text ? undefined : 'true'}
              >
                {letter}
              </span>
              <span className={`min-w-0 ${checked ? 'font-semibold' : ''}`}>{text || <span className="sr-only">{opt.label}</span>}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
