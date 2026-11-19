// components/dashboard/HighSchoolPanel.js — High School course: lessons done, then one ruled row per subject.
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SubjectArt from '@/components/art/SubjectArt'
import Segments from '@/components/kit/Segments'

// subjects = [{ slug, name, lessonCount, done }]
export default function HighSchoolPanel({ subjects, done, total, forms }) {
  return (
    <section className="min-w-0" aria-labelledby="hs-panel-title">
      <header className="rule-head">
        <h2 id="hs-panel-title" className="h-section">High School</h2>
        <Link href="/learn/high-school" className="group -my-3 inline-flex shrink-0 items-center gap-1.5 py-3 text-sm font-bold text-board-700 hover:text-board-900">
          All subjects <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <div className="flex items-center gap-4 py-6 sm:py-7">
        <span className="numeral text-[4rem] leading-[0.8] text-ink-900 sm:text-[4.5rem]" aria-hidden="true">{done}</span>
        <p className="min-w-0">
          <span className="sr-only">{done} </span>
          <span className="block text-[17px] font-bold leading-snug text-ink-900">of {total} lessons complete</span>
          <span className="mt-0.5 block text-[13px] font-semibold text-ink-500">
            Zambian O-Level{forms ? ` · ${forms.includes('–') ? 'Forms' : 'Form'} ${forms}` : ''}
          </span>
        </p>
      </div>

      <ul className="rows border-t border-ink-200">
        {subjects.map((s) => (
          <li key={s.slug}>
            <Link href={`/learn/high-school/${s.slug}`} className="group flex min-h-[64px] items-center gap-3 py-2.5 sm:gap-4">
              <SubjectArt name={s.slug} className="h-10 w-10" />
              <span className="min-w-0 flex-1 truncate text-base font-bold text-ink-900 decoration-ink-900 decoration-2 underline-offset-4 group-hover:underline">{s.name}</span>
              <Segments total={s.lessonCount} done={s.done} className="w-[72px] shrink-0 sm:w-28" label={`${s.done} of ${s.lessonCount} ${s.name} lessons complete`} />
              <span className="w-8 shrink-0 text-right text-sm font-semibold text-ink-600 tabular" aria-hidden="true">{s.done}/{s.lessonCount}</span>
              <ArrowRight className="nudge hidden h-4 w-4 shrink-0 text-ink-400 sm:block" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
