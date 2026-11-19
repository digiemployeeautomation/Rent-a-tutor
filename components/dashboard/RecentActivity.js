// components/dashboard/RecentActivity.js — latest quiz results and IELTS submissions, as a ruled list.
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SubjectArt from '@/components/art/SubjectArt'
import { relativeTime } from '@/components/dashboard/format'

// Green = passed, yellow = not yet. IELTS marks are not pass or fail, so they stay ink.
const SCORE_TONES = {
  passed: 'text-board-700',
  notyet: 'text-sun-700',
  band: 'text-ink-900',
}

// "Course · status · when". Each part keeps its dot in its own left padding
// and the row hides what hangs outside, so a wrapped line never starts or ends
// with a stray dot.
function Meta({ parts }) {
  return (
    <span className="mt-0.5 block overflow-hidden text-[13px] font-semibold leading-snug text-ink-500 lg:mt-0 lg:shrink-0 lg:text-sm">
      <span className="-ml-3.5 flex flex-wrap">
        {parts.filter(Boolean).map((part) => (
          <span key={part} className="relative whitespace-nowrap pl-3.5 before:absolute before:left-0 before:w-3.5 before:text-center before:content-['·']">{part}</span>
        ))}
      </span>
    </span>
  )
}

// items = [{ key, kind: 'hs'|'ielts', title, course, status, href, at, score: { value, label, tone } | null }]
export default function RecentActivity({ items, startHref }) {
  return (
    <section className="min-w-0" aria-labelledby="activity-title">
      <header className="rule-head">
        <h2 id="activity-title" className="h-section">Recent activity</h2>
      </header>

      {items.length === 0 ? (
        <div className="flex items-start gap-4 py-6 sm:gap-5 sm:py-7">
          <SubjectArt name="quiz" className="h-16 w-16 sm:h-20 sm:w-20" />
          <div className="min-w-0">
            <h3 className="h-sub">Your results will be listed here</h3>
            <p className="mt-1 max-w-[44ch] text-[15px] leading-relaxed text-ink-600">
              Finish a lesson quiz or an IELTS practice task and the score appears in this list, newest first.
            </p>
            <Link href={startHref} className="btn-secondary group mt-4">
              Start a lesson <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : (
        <ul className="rows">
          {items.map((it) => (
            <li key={it.key}>
              {/* Two lines on phones; one contents-page line (title, leader, details, mark) on desktop. */}
              <Link href={it.href} className="group flex min-h-[64px] items-center gap-3 py-3 sm:gap-4 lg:min-h-0 lg:items-baseline lg:gap-5 lg:py-4">
                <span className="min-w-0 flex-1 lg:flex lg:items-baseline lg:gap-4">
                  <span className="block text-base font-bold leading-snug text-ink-900 decoration-ink-900 decoration-2 underline-offset-4 group-hover:underline max-lg:line-clamp-2 lg:truncate lg:text-[17px]">{it.title}</span>
                  <span className="leader hidden lg:block" aria-hidden="true" />
                  <Meta parts={[it.course, it.status, relativeTime(it.at)]} />
                </span>
                <span className={`numeral shrink-0 text-right text-[1.625rem] leading-none lg:w-16 ${SCORE_TONES[it.score?.tone] || 'text-ink-900'}`}>
                  {it.score ? (
                    <>
                      <span aria-hidden="true">{it.score.value}</span>
                      <span className="sr-only">{it.score.label}</span>
                    </>
                  ) : null}
                </span>
                <ArrowRight className="nudge h-4 w-4 shrink-0 text-ink-400 lg:self-center" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
