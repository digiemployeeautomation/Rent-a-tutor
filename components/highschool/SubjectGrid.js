'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SubjectArt from '@/components/art/SubjectArt'
import Segments from '@/components/kit/Segments'
import useProgress from '@/components/highschool/useProgress'

// The subject index: one ruled row per subject, like a contents page.
export default function SubjectGrid({ subjects }) {
  const { progress } = useProgress()
  return (
    <ul className="border-t-2 border-ink-900">
      {subjects.map((s) => {
        const done = s.lessonIds.filter((id) => progress[id]?.passed).length
        const action = done === 0 ? 'Start' : done === s.lessonCount ? 'Review' : 'Continue'
        return (
          <li key={s.slug} className="border-b border-ink-200">
            <Link
              href={`/learn/high-school/${s.slug}`}
              className="group grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 py-5 sm:grid-cols-[auto_1fr_auto] sm:gap-x-6 sm:py-6 lg:grid-cols-[auto_1fr_260px_auto]"
            >
              <SubjectArt name={s.slug} className="h-14 w-14 sm:h-[72px] sm:w-[72px]" />
              <div className="min-w-0">
                <h2 className="font-display text-[1.375rem] font-semibold leading-tight text-ink-900 sm:text-[1.625rem]" style={{ letterSpacing: '-0.02em' }}>
                  <span className="bg-[length:0%_2px] bg-[linear-gradient(currentColor,currentColor)] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 ease-out group-hover:bg-[length:100%_2px]">{s.name}</span>
                </h2>
                <p className="mt-1 text-[15px] leading-snug text-ink-600">{s.blurb}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 sm:col-start-2 lg:col-start-3">
                <Segments total={s.lessonCount} done={done} />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-ink-500">
                    <span className="text-ink-900">{done} of {s.lessonCount}</span> done · Form {s.forms.join(', ')} · {s.minutes} min
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[15px] font-bold text-board-700 sm:hidden">
                    {action} <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
              <span className="hidden items-center gap-1.5 text-[15px] font-bold text-board-700 sm:col-start-3 sm:row-start-1 sm:inline-flex sm:justify-self-end lg:col-start-4">
                {action} <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
