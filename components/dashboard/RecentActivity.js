// components/dashboard/RecentActivity.js — latest quiz results and IELTS submissions.
import Link from 'next/link'
import { ChevronRight, History } from 'lucide-react'
import SubjectIcon from '@/components/highschool/SubjectIcon'
import { IeltsSectionIcon } from '@/components/dashboard/ielts-ui'
import { relativeTime } from '@/components/dashboard/format'

const TONES = {
  green: 'chip-green',
  sun: 'chip-sun',
  teal: 'chip-teal',
  plain: 'chip',
}

// items = [{ key, kind: 'hs'|'ielts', title, context, href, at, icon, tile, itemType, result: { label, tone } }]
export default function RecentActivity({ items, startHref }) {
  return (
    <section className="card flex h-full flex-col overflow-hidden" aria-labelledby="activity-title">
      <div className="flex items-center justify-between px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <h2 id="activity-title" className="h-section">Recent activity</h2>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-4 text-center">
          <span className="icon-tile bg-ink-50 text-ink-400"><History className="h-5 w-5" aria-hidden="true" /></span>
          <p className="mt-3 font-semibold text-ink-800">Nothing here yet</p>
          <p className="muted mt-1 max-w-xs">Finish a lesson quiz or an IELTS practice task and your results will show up here.</p>
          <Link href={startHref} className="btn-secondary btn-sm mt-4">Start a lesson</Link>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100 border-t border-ink-100">
          {items.map((it) => (
            <li key={it.key}>
              <Link href={it.href} className="group flex min-h-[64px] items-center gap-3 px-5 py-3 transition-colors hover:bg-ink-50 focus-visible:bg-ink-50 sm:px-6">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${it.tile}`}>
                  {it.kind === 'hs'
                    ? <SubjectIcon name={it.icon} className="h-[18px] w-[18px]" />
                    : <IeltsSectionIcon type={it.itemType} className="h-[18px] w-[18px]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink-900">{it.title}</span>
                  <span className="block truncate text-xs text-ink-400">{it.context} · {relativeTime(it.at)}</span>
                </span>
                {it.result ? <span className={`${TONES[it.result.tone] || 'chip'} shrink-0 tabular-nums`}>{it.result.label}</span> : null}
                <ChevronRight className="hidden h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
