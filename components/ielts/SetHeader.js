// components/ielts/SetHeader.js
//
// Page header for an IELTS practice set or task: back link, one copper
// eyebrow, the title, and a plain line of facts ("6 questions · 9 min timed").
//
// Props: { backHref, backLabel, eyebrow, title, chips, children }
//   - chips: [{ label }] (or plain strings). They are set as one line of text;
//     `icon` and `tone` on a chip are accepted for older callers and ignored.
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SetHeader({ backHref = '/practice', backLabel = 'IELTS', eyebrow, title, chips = [], children }) {
  const facts = (chips ?? [])
    .filter(Boolean)
    .map((c) => (typeof c === 'string' ? c : c.label))
    .filter(Boolean)

  return (
    <header>
      <Link href={backHref} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {backLabel}
      </Link>
      {eyebrow ? <p className="eyebrow mt-3 !text-copper-700 sm:mt-5">{eyebrow}</p> : null}
      <h1 className="h-page mt-1.5 text-balance">{title}</h1>
      {facts.length > 0 ? (
        <p className="mt-2.5 text-[13px] font-semibold leading-5 text-ink-500 tabular">{facts.join(' · ')}</p>
      ) : null}
      {children}
    </header>
  )
}
