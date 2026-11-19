'use client'
// components/practice/questions/SingleSelect.js
//
// Primitive: pick exactly one option. Covers MCQ-single, True/False/Not
// Given, Yes/No/Not Given, and all matching types. `options` is resolved by
// the caller (item payload options, or the registry's fixedOptions).
// `compact` lays short fixed options (TRUE / FALSE / NOT GIVEN) out in a row.
//
// Contract: { question, options: [{value,label}|string], value, onChange, compact }
import QuestionPrompt from '@/components/practice/questions/QuestionPrompt'

export default function SingleSelect({ question, options = [], value, onChange, compact = false }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <fieldset>
      <legend className="w-full">
        <QuestionPrompt question={question} answered={value != null && value !== ''} />
      </legend>
      <div className={`mt-3 grid gap-2 ${compact ? 'grid-cols-3' : ''}`}>
        {opts.map((opt) => {
          const checked = value === opt.value
          return (
            <label
              key={opt.value}
              className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-[15px] leading-snug transition-colors focus-within:ring-2 focus-within:ring-blue-200 ${
                compact ? 'justify-center px-2 text-center text-sm font-semibold' : ''
              } ${
                checked
                  ? 'border-blue-600 bg-blue-50 text-ink-900'
                  : 'border-ink-100 bg-white text-ink-700 hover:border-blue-300 hover:bg-blue-50/40'
              }`}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className={compact ? 'sr-only' : 'h-5 w-5 shrink-0 accent-blue-600'}
              />
              <span>{opt.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
