// components/dashboard/HighSchoolPanel.js — High School course summary (blue).
import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import SubjectIcon from '@/components/highschool/SubjectIcon'

// subjects = [{ slug, name, icon, tile, bar, lessonCount, done }]
export default function HighSchoolPanel({ subjects, done, total, forms }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <section className="card flex flex-col overflow-hidden" aria-labelledby="hs-panel-title">
      <div className="card-pad pb-0 sm:pb-0">
        <div className="flex items-start gap-3">
          <span className="icon-tile bg-blue-50 text-blue-700"><GraduationCap className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="hs-panel-title" className="h-section">High School</h2>
            <p className="muted mt-0.5">Zambian O-Level{forms ? ` · ${forms.includes('–') ? 'Forms' : 'Form'} ${forms}` : ''}</p>
          </div>
          <span className="chip-blue shrink-0">{pct}% done</span>
        </div>

        <div className="mt-5">
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-3xl font-bold tracking-tight text-ink-900">{done}</span>
            <span className="text-sm text-ink-500">of {total} lessons complete</span>
          </p>
          <div className="progress-track mt-2.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="High school lessons complete">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <ul className="mt-4 flex-1 divide-y divide-ink-100 border-t border-ink-100">
        {subjects.map((s) => {
          const sp = s.lessonCount > 0 ? Math.round((s.done / s.lessonCount) * 100) : 0
          return (
            <li key={s.slug}>
              <Link href={`/learn/high-school/${s.slug}`} className="flex min-h-[56px] items-center gap-3 px-5 py-2.5 transition-colors hover:bg-ink-50 focus-visible:bg-ink-50 sm:px-6">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.tile}`}>
                  <SubjectIcon name={s.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink-800">{s.name}</span>
                <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-ink-100 min-[400px]:block" aria-hidden="true">
                  <span className={`block h-full rounded-full ${s.bar}`} style={{ width: `${sp}%` }} />
                </span>
                <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-ink-600">
                  {s.done}/{s.lessonCount}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <Link href="/learn/high-school" className="group flex min-h-[52px] items-center justify-between border-t border-ink-100 px-5 text-sm font-semibold text-blue-700 hover:bg-blue-50/50 sm:px-6">
        All subjects
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </section>
  )
}
