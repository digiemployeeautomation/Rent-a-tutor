// components/ielts/Passage.js
//
// An IELTS reading passage set like a printed page: a paper sheet, book
// typography at a reading measure. Paragraphs are split on blank lines; a
// leading paragraph letter ("A. ...") is set in the margin, as in the real test.
// On large screens the sheet scrolls inside itself when its parent limits its
// height (the question runner pins it beside the questions).
export default function Passage({ title, text }) {
  const paragraphs = String(text ?? '')
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^([A-H])\.\s+([\s\S]*)$/)
      return m ? { letter: m[1], body: m[2] } : { letter: null, body: p }
    })
  const lettered = paragraphs.some((p) => p.letter)

  return (
    <article className="sheet px-5 py-6 sm:px-8 sm:py-8 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
      <p className="text-[13px] font-bold leading-5 text-copper-700">Reading passage</p>
      {title ? (
        <h2 className="mt-1 font-display text-[1.5rem] font-semibold leading-tight text-ink-900 sm:text-[1.75rem]">{title}</h2>
      ) : null}
      <div className="mt-4 max-w-[65ch] space-y-5">
        {paragraphs.map((p, i) => (
          <div key={i} className={lettered ? 'grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3' : ''}>
            {lettered ? (
              <span
                className="font-display text-[1.125rem] font-semibold leading-[1.75rem] text-copper-600"
                aria-label={p.letter ? `Paragraph ${p.letter}` : undefined}
              >
                {p.letter}
              </span>
            ) : null}
            <p className="whitespace-pre-line text-[17px] leading-[1.65] text-ink-800">{p.body}</p>
          </div>
        ))}
      </div>
    </article>
  )
}
