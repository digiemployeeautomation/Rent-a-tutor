'use client'
// components/practice/questions/TextFill.js
//
// Primitive: type a word/number/phrase. Covers sentence/summary/note/table/
// flow-chart completion, diagram labelling, and short-answer questions.
// `wordLimit` is shown as guidance (the grader enforces it).
//
// Contract: { question, value, wordLimit, onChange }
import QuestionPrompt from '@/components/practice/questions/QuestionPrompt'

export default function TextFill({ question, value = '', wordLimit, onChange }) {
  const text = String(value ?? '')
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const over = wordLimit != null && words > wordLimit
  const id = `q-${question.id}`

  return (
    <div>
      <label htmlFor={id} className="block">
        <QuestionPrompt question={question} answered={text.trim() !== ''} />
      </label>
      <input
        id={id}
        type="text"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-describedby={wordLimit != null ? `${id}-limit` : undefined}
        aria-invalid={over || undefined}
        className={`field mt-3 ${over ? '!border-rose-400 focus:!ring-rose-100' : ''}`}
        placeholder="Type your answer"
      />
      {wordLimit != null ? (
        <p id={`${id}-limit`} className={`mt-1.5 text-sm ${over ? 'font-medium text-rose-600' : 'text-ink-400'}`}>
          No more than {wordLimit === 1 ? 'one word' : `${wordLimit} words`}
          {over ? ` — you have ${words}` : ''}
        </p>
      ) : null}
    </div>
  )
}
