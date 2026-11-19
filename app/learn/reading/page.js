// app/learn/reading/page.js
//
// The Reading "teach-then-test" path hub. Lists published reading lessons
// (modules) in order with completion status, then the capstone exam card.
// The exam is always open; the lessons are the recommended route to it. Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Clock, Trophy } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { READING_EXAM_ITEM_ID, isExamUnlocked } from '@/lib/ielts/reading-modules'

export default async function ReadingPathPage() {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/learn/reading')

  const { data: modules } = await supabase
    .from('skill_lessons')
    .select('slug, title, summary, drill_item_id, position')
    .eq('section', 'reading')
    .eq('status', 'published')
    .order('position', { ascending: true })

  const mods = modules ?? []
  const drillIds = mods.map((m) => m.drill_item_id).filter(Boolean)

  let completedDrillIds = []
  if (drillIds.length > 0) {
    const { data: subs } = await supabase
      .from('submissions')
      .select('practice_item_id, status')
      .eq('user_id', user.id)
      .in('practice_item_id', drillIds)
      .eq('status', 'graded')
    completedDrillIds = [...new Set((subs ?? []).map((s) => s.practice_item_id))]
  }

  const allLessonsDone = isExamUnlocked(mods, completedDrillIds)
  const isDone = (m) => !!m.drill_item_id && completedDrillIds.includes(m.drill_item_id)
  const doneCount = mods.filter(isDone).length
  const nextIdx = mods.findIndex((m) => !isDone(m))
  const pct = mods.length ? Math.round((doneCount / mods.length) * 100) : 0

  return (
    <div className="container-read py-6 sm:py-10">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS
      </Link>

      <p className="eyebrow mt-3 !text-teal-700">IELTS Reading</p>
      <h1 className="h-page mt-2">Learn Reading step by step</h1>
      <p className="lead mt-2">
        Each lesson teaches one question type in a few short slides, then you practise it on a real-style passage.
      </p>

      {mods.length > 0 ? (
        <div className="card card-pad mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-ink-800">{doneCount} of {mods.length} lessons done</span>
            <span className="text-ink-400">{pct}%</span>
          </div>
          <div className="progress-track">
            <div className="h-full rounded-full bg-teal-600 transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 text-sm text-ink-500">
            A lesson counts as done when you finish its practice set. The final exam is open at any time — the lessons get you ready for it.
          </p>
        </div>
      ) : null}

      {mods.length === 0 ? (
        <div className="card card-pad mt-8 text-center">
          <p className="text-ink-700">Reading lessons are being written and will appear here soon.</p>
          <Link href="/practice" className="btn-primary mt-4">Practise Reading sets instead</Link>
        </div>
      ) : (
        <ol className="mt-8 space-y-3">
          {mods.map((m, i) => {
            const done = isDone(m)
            const current = i === nextIdx
            return (
              <li key={m.slug}>
                <Link
                  href={`/learn/reading/${m.slug}`}
                  className={`card card-hover group relative flex items-center gap-4 p-4 sm:p-5 ${current ? 'border-teal-300 ring-2 ring-teal-100' : ''}`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      done ? 'bg-emerald-600 text-white' : current ? 'bg-teal-600 text-white' : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    {done ? <Check className="h-5 w-5" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Lesson {i + 1}</span>
                      {done ? <span className="chip-green">Done</span> : current ? <span className="chip-teal">Up next</span> : null}
                    </span>
                    <span className="mt-0.5 block font-display text-[17px] font-bold text-ink-900">{m.title}</span>
                    {m.summary ? <span className="mt-0.5 block text-sm leading-relaxed text-ink-500">{m.summary}</span> : null}
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-ink-600" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ol>
      )}

      {mods.length > 0 ? (
        <div className="mt-6">
          <div className="rounded-2xl bg-ink-900 p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="icon-tile bg-sun-400 text-ink-900"><Trophy className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sun-300">
                  {allLessonsDone ? 'You are ready' : 'Open any time'}
                </p>
                <p className="font-display text-lg font-bold">Final exam: full Reading set</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-200">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Timed, with an estimated band score
                </p>
                {!allLessonsDone ? (
                  <p className="mt-1 text-sm text-ink-300">
                    Tip: you will score better after the lessons above ({mods.length - doneCount} still to do).
                  </p>
                ) : null}
              </div>
            </div>
            <Link href={`/practice/reading/${READING_EXAM_ITEM_ID}`} className="btn-accent btn-lg mt-4 w-full shrink-0 sm:mt-0 sm:w-auto">
              Start the exam <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
