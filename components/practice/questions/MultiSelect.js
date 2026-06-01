'use client'
// components/practice/questions/MultiSelect.js
//
// Primitive: pick several options (e.g. "Choose TWO letters"). `max` is the
// required number of selections; once reached, further unchecked boxes are
// disabled so the student cannot over-select.
//
// Contract: { question, options, value: string[], max, onChange }

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
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-800">
        {question.position}. {question.prompt}
        {max != null ? <span className="ml-1 text-xs text-gray-400">(choose {max})</span> : null}
      </legend>
      {opts.map((opt) => {
        const checked = selected.includes(opt.value)
        const disabled = !checked && max != null && selected.length >= max
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              checked
                ? 'border-blue-500 bg-blue-50 text-gray-900'
                : disabled
                ? 'cursor-not-allowed border-gray-100 text-gray-300'
                : 'cursor-pointer border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(opt.value)}
              className="h-4 w-4"
            />
            <span>{opt.label}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
