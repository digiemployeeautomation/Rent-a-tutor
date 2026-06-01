'use client'
// components/practice/questions/TextFill.js
//
// Primitive: type a word/number/phrase. Covers sentence/summary/note/table/
// flow-chart completion, diagram labelling, and short-answer questions.
// `wordLimit` is shown as guidance (the grader enforces it).
//
// Contract: { question, value, wordLimit, onChange }

export default function TextFill({ question, value = '', wordLimit, onChange }) {
  const words = String(value).trim() ? String(value).trim().split(/\s+/).length : 0
  const over = wordLimit != null && words > wordLimit

  return (
    <div className="space-y-1">
      <label htmlFor={`q-${question.id}`} className="block text-sm font-medium text-gray-800">
        {question.position}. {question.prompt}
      </label>
      <input
        id={`q-${question.id}`}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          over ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
        }`}
        placeholder="Your answer"
      />
      {wordLimit != null ? (
        <p className={`text-xs ${over ? 'text-red-500' : 'text-gray-400'}`}>
          No more than {wordLimit} word{wordLimit === 1 ? '' : 's'}
          {over ? ` — you have ${words}` : ''}
        </p>
      ) : null}
    </div>
  )
}
