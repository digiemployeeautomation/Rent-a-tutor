'use client'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import SubjectIcon from '@/components/highschool/SubjectIcon'
import useProgress from '@/components/highschool/useProgress'

export default function SubjectGrid({ subjects }) {
  const { progress } = useProgress()
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((s) => {
        const done = s.lessonIds.filter((id) => progress[id]?.passed).length
        const pct = Math.round((done / s.lessonCount) * 100)
        return (
          <Link key={s.slug} href={`/learn/high-school/${s.slug}`} className="card card-hover card-pad group flex flex-col">
            <div className="flex items-start justify-between">
              <span className={`icon-tile ${s.tile}`}><SubjectIcon name={s.icon} /></span>
              <span className="chip">Form {s.forms.join(', ')}</span>
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-ink-900">{s.name}</h3>
            <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-ink-500">{s.blurb}</p>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-400">
                <span>{done} of {s.lessonCount} lessons done</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {s.minutes} min</span>
              </div>
              <div className="progress-track"><div className={`h-full rounded-full transition-[width] duration-700 ${s.bar}`} style={{ width: `${pct}%` }} /></div>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
              {done === 0 ? 'Start learning' : done === s.lessonCount ? 'Review lessons' : 'Continue'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        )
      })}
    </div>
  )
}
