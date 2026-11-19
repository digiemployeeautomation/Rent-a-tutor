'use client'
// components/practice/questions/MultiSelect.js
//
// Primitive: pick several options (e.g. "Choose TWO letters"). `max` is the
// required number of selections; once reached, further unchecked boxes are
// disabled so the student cannot over-select.
//
// Contract: { question, options, value: string[], max, onChange }
import QuestionPrompt from '@/components/practice/questions/QuestionPrompt'

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
    <fieldset>
      <legend className="w-full">
        <QuestionPrompt
          question={question}
          answered={selected.length > 0}
          hint={max != null ? `(choose ${max} · ${selected.length} chosen)` : null}
        />
      </legend>
      <div className="mt-3 grid gap-2">
        {opts.map((opt) => {
          const checked = selected.includes(opt.value)
          const disabled = !checked && max != null && selected.length >= max
          return (
            <label
              key={opt.value}
              className={`flex min-h-[48px] items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-[15px] leading-snug transition-colors focus-within:ring-2 focus-within:ring-blue-200 ${
                checked
                  ? 'cursor-pointer border-blue-600 bg-blue-50 text-ink-900'
                  : disabled
                  ? 'cursor-not-allowed border-ink-100 bg-ink-50/50 text-ink-300'
                  : 'cursor-pointer border-ink-100 bg-white text-ink-700 hover:border-blue-300 hover:bg-blue-50/40'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(opt.value)}
                className="h-5 w-5 shrink-0 accent-blue-600"
              />
              <span>{opt.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
