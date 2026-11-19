// components/ielts/Passage.js
//
// Readable IELTS reading passage. Paragraphs are split on blank lines; a
// leading paragraph letter ("A. ...") is shown as a badge, as in the real test.
export default function Passage({ title, text }) {
  const paragraphs = String(text ?? '')
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <article className="card card-pad">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Reading passage</p>
      {title ? <h2 className="mt-1 font-display text-xl font-bold text-ink-900 sm:text-2xl">{title}</h2> : null}
      <div className="mt-4 space-y-4">
        {paragraphs.map((p, i) => {
          const m = p.match(/^([A-H])\.\s+([\s\S]*)$/)
          if (!m) {
            return (
              <p key={i} className="whitespace-pre-line text-[16px] leading-[1.75] text-ink-800 sm:text-[17px]">{p}</p>
            )
          }
          return (
            <div key={i} className="flex gap-3">
              <span
                className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-50 text-xs font-bold text-teal-700"
                aria-label={`Paragraph ${m[1]}`}
              >
                {m[1]}
              </span>
              <p className="whitespace-pre-line text-[16px] leading-[1.75] text-ink-800 sm:text-[17px]">{m[2]}</p>
            </div>
          )
        })}
      </div>
    </article>
  )
}
