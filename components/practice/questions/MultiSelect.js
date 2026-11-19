'use client'
// components/practice/questions/MultiSelect.js
//
// Primitive: pick several options (e.g. "Choose TWO letters"). `max` is the
// required number of selections; once reached, further unchecked boxes are
// disabled so the student cannot over-select. Options are bordered rows with
// a square check mark, so they never read as "pick one".
//
// Contract: { question, options, value: string[], max, onChange }
import { Check } from 'lucide-react'
import QuestionPrompt from '@/components/practice/questions/QuestionPrompt'
import { splitOption } from '@/components/ielts/option-labels'

export default function MultiSelect({ question, options = [], value = [], max, onChange }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  const selected = Array.isArray(value) ? value : []

  function toggle(optValue) {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue))
    } else {
      if (max != null && selected.length >= max) return
      onChange([...selected, optValue])
    }
  }

  return (
    <fieldset className="min-w-0">
      <legend className="w-full">
        <QuestionPrompt
          question={question}
          answered={selected.length > 0}
          hint={max != null ? `Choose ${max} · ${selected.length} chosen` : null}
        />
      </legend>
      <div className="mt-3 grid gap-2 pl-10">
        {opts.map((opt, i) => {
          const checked = selected.includes(opt.value)
          const disabled = !checked && max != null && selected.length >= max
          const { letter, text } = splitOption(opt, i)
          return (
            <label
              key={opt.value}
              className={`flex min-h-[48px] items-center gap-3 rounded-lg border px-3 py-2.5 text-base leading-snug transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-board-600 ${
                checked
                  ? 'cursor-pointer border-board-700 bg-board-50 text-ink-900'
                  : disabled
                  ? 'cursor-not-allowed border-ink-200 bg-ink-50 text-ink-500'
                  : 'cursor-pointer border-ink-300 bg-white text-ink-800 hover:border-ink-900'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(opt.value)}
                className="sr-only"
              />
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-[1.5px] transition-colors duration-150 ${
                  checked ? 'border-board-700 bg-board-700 text-chalk' : disabled ? 'border-ink-300 bg-ink-50' : 'border-ink-400 bg-white'
                }`}
                aria-hidden="true"
              >
                {checked ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
              </span>
              <span className={`min-w-0 ${checked ? 'font-semibold' : ''}`}>
                {text ? <><span className="mr-2.5 font-display text-[15px] font-semibold text-ink-700">{letter}</span>{text}</> : opt.label}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
