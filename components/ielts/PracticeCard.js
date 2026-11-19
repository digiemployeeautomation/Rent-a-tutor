// components/ielts/PracticeCard.js
//
// One practice item on the IELTS hub. Server-safe (no hooks).
// Props: { href, title, kicker, band, facts: string[], benefit, benefitIcon, done, cta }
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function PracticeCard({
  href,
  title,
  kicker,
  band,
  facts = [],
  benefit,
  benefitIcon: BenefitIcon,
  done = false,
  cta = 'Start',
}) {
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {kicker ? <span className="chip-teal">{kicker}</span> : null}
        {band != null ? <span className="chip">Band {Number(band).toFixed(1)}</span> : null}
        {done ? (
          <span className="chip-green">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Done
          </span>
        ) : null}
      </div>
      <h4 className="mt-3 font-display text-[17px] font-bold leading-snug text-ink-900">{title}</h4>
      {facts.length > 0 ? (
        <p className="mt-1 text-sm text-ink-500 first-letter:uppercase">{facts.join(' · ')}</p>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {benefit ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
            {BenefitIcon ? <BenefitIcon className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" /> : null}
            {benefit}
          </span>
        ) : <span />}
        {href ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700">
            {done ? 'Try again' : cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium text-ink-400">Coming soon</span>
        )}
      </div>
    </>
  )

  if (!href) {
    return <div className="card flex h-full flex-col p-5 opacity-60">{body}</div>
  }
  return (
    <Link href={href} className="card card-hover group flex h-full flex-col p-5">
      {body}
    </Link>
  )
}
