// components/practice/questions/QuestionPrompt.js
//
// Shared question heading: the question number as a small printed numeral
// (copper while it is still to do, green once answered) and the prompt in bold.
// `children` replaces the prompt text (TextFill uses it to set the answer box
// inside the sentence); `hint` is a quiet line under the prompt.
export default function QuestionPrompt({ question, answered = false, hint = null, children = null }) {
  return (
    <span className="flex items-baseline gap-3">
      <span
        className={`numeral w-7 shrink-0 text-[1.375rem] leading-7 transition-colors duration-150 ${answered ? 'text-board-700' : 'text-copper-600'}`}
        aria-hidden="true"
      >
        {question.position}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-bold leading-snug text-ink-900">
          <span className="sr-only">Question {question.position}. </span>
          {children ?? question.prompt}
        </span>
        {hint ? <span className="mt-1 block text-[13px] font-semibold leading-5 text-ink-500 tabular">{hint}</span> : null}
      </span>
    </span>
  )
}
