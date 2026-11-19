// components/practice/questions/QuestionPrompt.js
//
// Shared question heading: a numbered badge (filled once answered) + prompt.
export default function QuestionPrompt({ question, answered = false, hint = null }) {
  return (
    <span className="flex items-start gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums ${
          answered ? 'bg-blue-600 text-white' : 'bg-ink-100 text-ink-600'
        }`}
        aria-hidden="true"
      >
        {question.position}
      </span>
      <span className="pt-0.5 text-[16px] font-medium leading-relaxed text-ink-900">
        <span className="sr-only">Question {question.position}. </span>
        {question.prompt}
        {hint ? <span className="ml-1.5 text-sm font-normal text-ink-400">{hint}</span> : null}
      </span>
    </span>
  )
}
