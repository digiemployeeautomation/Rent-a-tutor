'use client'
// components/practice/questions/TextFill.js
//
// Primitive: type a word/number/phrase. Covers sentence/summary/note/table/
// flow-chart completion, diagram labelling, and short-answer questions.
// When the prompt has a gap ("planting connected ____ of flowers") the answer
// box sits inside the sentence, where the gap is; otherwise it goes under the
// question. `wordLimit` is shown as guidance (the grader enforces it).
//
// Contract: { question, value, wordLimit, onChange }
import QuestionPrompt from '@/components/practice/questions/QuestionPrompt'

const GAP = /_{3,}/

export default function TextFill({ question, value = '', wordLimit, onChange }) {
  const text = String(value ?? '')
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const over = wordLimit != null && words > wordLimit
  const id = `q-${question.id}`
  const prompt = String(question.prompt ?? '')
  const gap = prompt.match(GAP)
  const inline = !!gap

  const input = (
    <input
      id={id}
      type="text"
      value={text}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      aria-label={inline ? `Answer for question ${question.position}` : undefined}
      aria-describedby={wordLimit != null ? `${id}-limit` : undefined}
      aria-invalid={over || undefined}
      placeholder={inline ? '' : 'Type your answer'}
      className={`field font-semibold ${inline ? 'mx-1 my-1 inline-block w-36 px-2.5 py-1.5 align-middle sm:w-44' : 'max-w-sm'} ${
        over ? '!border-rose-600 focus:!ring-rose-100' : ''
      }`}
    />
  )

  const limit = wordLimit != null ? (
    <span id={`${id}-limit`} className={over ? 'font-bold text-rose-700' : undefined}>
      Write no more than {wordLimit === 1 ? 'one word' : `${wordLimit} words`}
      {over ? `. You have ${words}.` : ''}
    </span>
  ) : null

  if (inline) {
    const before = prompt.slice(0, gap.index)
    const after = prompt.slice(gap.index + gap[0].length)
    return (
      <div>
        <QuestionPrompt question={question} answered={text.trim() !== ''} hint={limit}>
          {before}{input}{after}
        </QuestionPrompt>
      </div>
    )
  }

  return (
    <div>
      <label htmlFor={id} className="block">
        <QuestionPrompt question={question} answered={text.trim() !== ''} />
      </label>
      <div className="mt-3 pl-10">
        {input}
        {limit ? <p className="mt-1.5 text-[13px] font-semibold leading-5 text-ink-500">{limit}</p> : null}
      </div>
    </div>
  )
}
