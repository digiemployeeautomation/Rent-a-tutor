'use client'
import Link from 'next/link'
import { Check, ChevronRight, Clock, PlayCircle } from 'lucide-react'
import useProgress from '@/components/highschool/useProgress'

// Lessons of one topic, with a tick for each one the student has passed.
export default function LessonList({ lessons, bar = 'bg-blue-600' }) {
  const { progress } = useProgress()
  const firstTodo = lessons.find((l) => !progress[l.id]?.passed)
  return (
    <ol className="divide-y divide-ink-100">
      {lessons.map((l, i) => {
        const p = progress[l.id]
        const done = !!p?.passed
        const isNext = firstTodo?.id === l.id
        return (
          <li key={l.id}>
            <Link href={`/learn/high-school/${l.subject}/${l.slug}`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-50 sm:px-6">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? 'bg-emerald-500 text-white' : isNext ? `${bar} text-white` : 'bg-ink-100 text-ink-500'}`}>
                {done ? <Check className="h-5 w-5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold text-ink-900">{l.title}</span>
                <span className="mt-0.5 block truncate text-sm text-ink-400">{l.summary}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink-400">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {l.minutes} min</span>
                  <span>{l.questionCount}-question quiz</span>
                  {done ? <span className="text-emerald-600">Passed · {p.score}/{p.total}</span> : p ? <span className="text-sun-600">Last try {p.score}/{p.total}</span> : null}
                </span>
              </span>
              {isNext ? (
                <span className="hidden items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:inline-flex"><PlayCircle className="h-4 w-4" /> {p ? 'Continue' : 'Start'}</span>
              ) : null}
              <ChevronRight className="h-5 w-5 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
