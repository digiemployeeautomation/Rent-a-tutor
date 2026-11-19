// components/ielts/SetHeader.js
//
// Page header for an IELTS practice set or result: back link, eyebrow,
// title, and small fact chips.
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SetHeader({ backHref = '/practice', backLabel = 'IELTS', eyebrow, title, chips = [], children }) {
  return (
    <header>
      <Link href={backHref} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {backLabel}
      </Link>
      {eyebrow ? <p className="eyebrow mt-2 !text-teal-700">{eyebrow}</p> : null}
      <h1 className="h-page mt-1.5">{title}</h1>
      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.filter(Boolean).map((c, i) => (
            <span key={i} className={c.tone || 'chip'}>
              {c.icon ? <c.icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              {c.label}
            </span>
          ))}
        </div>
      ) : null}
      {children}
    </header>
  )
}
