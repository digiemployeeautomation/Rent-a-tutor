'use client'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import useProgress from '@/components/highschool/useProgress'

// Lessons of one topic, set out like a contents page: number, title, dotted
// leader, time. A tick replaces the number once the quiz is passed.
export default function LessonList({ lessons }) {
  const { progress } = useProgress()
  const firstTodo = lessons.find((l) => !progress[l.id]?.passed)
  return (
    <ol className="rows">
      {lessons.map((l, i) => {
        const p = progress[l.id]
        const done = !!p?.passed
        const isNext = firstTodo?.id === l.id
        return (
          <li key={l.id}>
            <Link href={`/learn/high-school/${l.subject}/${l.slug}`} className="group flex items-start gap-4 py-4 sm:items-center sm:gap-5 sm:py-5">
              <span className="flex w-8 shrink-0 justify-center pt-0.5 sm:w-10 sm:pt-0" aria-hidden="true">
                {done ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-board-700 text-chalk"><Check className="h-4 w-4" strokeWidth={3} /></span>
                ) : (
                  <span className={`numeral text-[1.75rem] leading-8 ${isNext ? 'text-board-700' : 'text-ink-300'}`}>{i + 1}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-3">
                  <span className="text-[17px] font-bold leading-snug text-ink-900 decoration-ink-900 decoration-2 underline-offset-4 group-hover:underline">{l.title}</span>
                  <span className="leader hidden sm:block" aria-hidden="true" />
                  <span className="hidden shrink-0 text-sm font-semibold text-ink-500 tabular sm:block">{l.minutes} min</span>
                </span>
                <span className="mt-1 block text-[15px] leading-snug text-ink-600 sm:truncate">{l.summary}</span>
                <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-ink-500">
                  <span className="sm:hidden">{l.minutes} min</span>
                  <span>{l.questionCount}-question quiz</span>
                  {done ? <span className="text-board-700">Passed {p.score}/{p.total}</span> : p ? <span className="text-sun-700">Last try {p.score}/{p.total}</span> : null}
                </span>
              </span>
              {isNext ? (
                <span className="btn-primary btn-sm mt-0.5 hidden sm:inline-flex">{p ? 'Try again' : 'Start'} <ArrowRight className="nudge h-4 w-4" aria-hidden="true" /></span>
              ) : (
                <ArrowRight className="nudge mt-1.5 hidden h-4 w-4 shrink-0 text-ink-400 sm:mt-0 sm:block" aria-hidden="true" />
              )}
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
