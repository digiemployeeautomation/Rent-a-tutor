// components/ielts/PracticeCard.js
//
// One practice item on the IELTS hub, set as a ruled contents row (not a
// card): title, dotted leader, facts, then the action. Server-safe (no hooks).
// Render it inside a <ul className="rows">.
//
// Props: { href, title, kicker, band, facts: string[], done, cta, featured }
//   - kicker: one plain line under the title ("Goes with lesson 2", "Part 1")
//   - featured: the timed mock exam: larger title and a copper button
//   - benefit / benefitIcon are accepted for older callers and ignored
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

export default function PracticeCard({
  href,
  title,
  kicker,
  band,
  facts = [],
  done = false,
  cta = 'Start',
  featured = false,
}) {
  const meta = [...facts, band != null ? `Band ${Number(band).toFixed(1)}` : null].filter(Boolean).join(' · ')
  const action = done ? 'Try again' : cta

  const body = (
    <>
      <span className="w-full min-w-0 flex-1">
        <span className="flex items-baseline gap-3">
          <span
            className={
              featured
                ? 'font-display text-[1.375rem] font-semibold leading-tight text-ink-900 decoration-ink-900 decoration-2 underline-offset-4 group-hover:underline sm:text-[1.625rem]'
                : 'text-[17px] font-bold leading-snug text-ink-900 decoration-ink-900 decoration-2 underline-offset-4 group-hover:underline'
            }
            style={featured ? { letterSpacing: '-0.02em' } : undefined}
          >
            {title}
          </span>
          <span className="leader hidden md:block" aria-hidden="true" />
          {meta ? <span className="hidden shrink-0 text-sm font-semibold text-ink-500 tabular md:block">{meta}</span> : null}
        </span>
        {meta ? <span className="mt-1 block text-[13px] font-semibold leading-5 text-ink-500 tabular md:hidden">{meta}</span> : null}
        {kicker || done ? (
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[15px] leading-snug text-ink-600">
            {kicker ? <span>{kicker}</span> : null}
            {done ? (
              <span className="inline-flex items-center gap-1 text-[13px] font-bold text-board-700">
                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> Done
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      {!href ? (
        <span className="shrink-0 text-[13px] font-semibold text-ink-500">Coming soon</span>
      ) : featured ? (
        <span className="btn-copper shrink-0">
          {action} <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
        </span>
      ) : (
        <span className="inline-flex min-w-[6.25rem] shrink-0 items-center justify-end gap-1.5 text-[15px] font-bold text-board-700">
          {action} <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </>
  )

  const layout = featured
    ? 'flex flex-col items-start gap-4 py-5 sm:flex-row sm:items-center sm:gap-6 sm:py-6'
    : 'flex items-center gap-4 py-4 sm:gap-6 sm:py-[1.125rem]'

  return (
    <li>
      {href ? (
        <Link href={href} className={`group ${layout}`}>{body}</Link>
      ) : (
        <div className={`${layout} opacity-60`}>{body}</div>
      )}
    </li>
  )
}
