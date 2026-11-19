// components/dashboard/ContinueCard.js — the dark "Continue learning" hero.
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, ListChecks, RotateCcw } from 'lucide-react'
import SubjectIcon from '@/components/highschool/SubjectIcon'
import { PASS_MARK } from '@/lib/highschool/subjects'

// next = { lesson, meta, position, count, href, last } | null
// mode = 'start' | 'continue' | 'retry' | 'done'
export default function ContinueCard({ next, mode }) {
  if (!next) {
    return (
      <section className="card card-pad flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="icon-tile bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <h2 className="h-section">You have finished every lesson</h2>
            <p className="muted mt-0.5">New topics are added as they are written. Review any lesson in the meantime.</p>
          </div>
        </div>
        <Link href="/learn/high-school" className="btn-secondary w-full sm:w-auto">Review lessons</Link>
      </section>
    )
  }

  const { lesson, meta, position, count, href, last } = next
  // Smallest score that passes (avoids float noise such as 0.6 * 5 = 3.0000000000000004).
  const passMark = last ? Math.ceil(last.total * PASS_MARK - 1e-9) : 0
  const eyebrow = mode === 'start' ? 'Start here' : mode === 'retry' ? 'Pick up where you left off' : 'Continue learning'
  const cta = mode === 'start' ? 'Start lesson' : mode === 'retry' ? 'Try again' : 'Continue'

  return (
    <section className="relative overflow-hidden rounded-2xl bg-ink-900 text-white shadow-lift animate-fade-in-up">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-sun-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 p-5 sm:p-8 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun-300">{eyebrow}</p>

          <div className="mt-4 flex items-center gap-3">
            <span className={`icon-tile ${meta.tile}`}><SubjectIcon name={meta.icon} /></span>
            <div className="min-w-0 text-sm leading-snug">
              <p className="font-semibold text-white">{meta.name} <span className="font-normal text-white/60">· Form {lesson.form}</span></p>
              <p className="truncate text-white/60">{lesson.topic} · Lesson {position} of {count}</p>
            </div>
          </div>

          <h2 className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">{lesson.title}</h2>
          {lesson.summary ? <p className="mt-2 line-clamp-2 max-w-2xl text-[15px] leading-relaxed text-white/70">{lesson.summary}</p> : null}

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
            <li className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" /> {lesson.minutes} min</li>
            {lesson.questionCount > 0 ? (
              <li className="inline-flex items-center gap-1.5"><ListChecks className="h-4 w-4" aria-hidden="true" /> {lesson.questionCount}-question quiz</li>
            ) : null}
            {mode === 'retry' && last ? (
              <li className="inline-flex items-center gap-1.5 text-sun-300">
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Last score {last.score}/{last.total} · pass mark {passMark}
              </li>
            ) : null}
          </ul>
        </div>

        <Link href={href} className="btn-accent btn-lg w-full shrink-0 md:w-auto">
          {cta} <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
