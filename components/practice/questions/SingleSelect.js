'use client'
// components/practice/questions/SingleSelect.js
//
// Primitive: pick exactly one option. Covers MCQ-single, True/False/Not
// Given, Yes/No/Not Given, and all matching types. `options` is resolved by
// the caller (item payload options, or the registry's fixedOptions).
//
// Contract: { question, options: [{value,label}|string], value, onChange }

export default function SingleSelect({ question, options = [], value, onChange }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-800">
        {question.position}. {question.prompt}
      </legend>
      {opts.map((opt) => (
        <label
          key={opt.value}
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            value === opt.value
              ? 'border-blue-500 bg-blue-50 text-gray-900'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name={`q-${question.id}`}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4"
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
