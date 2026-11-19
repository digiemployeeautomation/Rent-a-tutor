// app/learn/reading/page.js
//
// The Reading "teach-then-test" path hub. Lists published reading lessons
// (modules) as a numbered contents page with completion status, then the
// capstone exam as the last, featured row. The exam is always open; the
// lessons are the recommended route to it. Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { READING_EXAM_ITEM_ID, isExamUnlocked } from '@/lib/ielts/reading-modules'
import SubjectArt from '@/components/art/SubjectArt'
import Segments from '@/components/kit/Segments'

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
  const left = mods.length - doneCount

  return (
    <div className="container-app pb-16 pt-6 sm:pt-10">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS
      </Link>

      <header className="mt-3 flex items-end justify-between gap-6 sm:mt-6">
        <div className="max-w-2xl">
          <p className="eyebrow !text-copper-700">
            IELTS Reading{mods.length > 0 ? ` · ${mods.length} lesson${mods.length === 1 ? '' : 's'} and a final exam` : ''}
          </p>
          <h1 className="h-display mt-2 text-balance">Reading, step by step.</h1>
          <p className="lead mt-4">
            Each lesson teaches one question type in a few short slides, then you practise it on a real-style passage.
          </p>
        </div>
        <SubjectArt name="reading" tone="copper" className="hidden h-28 w-28 sm:block lg:h-36 lg:w-36" />
      </header>

      {mods.length === 0 ? (
        <div className="mt-12 max-w-xl border-t-2 border-ink-900 pt-5">
          <h2 className="h-section">Lessons are on their way</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600">Reading lessons are being written and will appear here soon.</p>
          <Link href="/practice" className="btn-primary mt-5">Practise Reading sets instead</Link>
        </div>
      ) : (
        <section className="mt-10 sm:mt-14" aria-labelledby="lessons-title">
          <header className="rule-head flex-wrap items-end">
            <div>
              <h2 id="lessons-title" className="h-section">Lessons</h2>
              <p className="mt-0.5 text-[15px] leading-snug text-ink-600">A lesson counts as done when you finish its practice set.</p>
            </div>
            <div className="w-full sm:w-[220px]">
              <Segments total={mods.length} done={doneCount} tone="copper" label={`${doneCount} of ${mods.length} lessons done`} />
              <p className="mt-2 text-[13px] font-semibold text-ink-500 tabular sm:text-right">
                <span className="text-ink-900">{doneCount} of {mods.length}</span> lessons done
              </p>
            </div>
          </header>

          <ol className="divide-y divide-ink-200">
            {mods.map((m, i) => {
              const done = isDone(m)
              const current = i === nextIdx
              const status = done ? 'Done' : current ? 'Up next' : 'Lesson and practice set'
              const statusTone = done ? 'text-board-700' : current ? 'text-copper-700' : 'text-ink-500'
              return (
                <li key={m.slug}>
                  <Link href={`/learn/reading/${m.slug}`} className="group flex items-start gap-4 py-4 sm:items-center sm:gap-5 sm:py-5">
                    <span className="flex w-8 shrink-0 justify-center pt-0.5 sm:w-10 sm:pt-0" aria-hidden="true">
                      {done ? (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-board-700 text-chalk"><Check className="h-4 w-4" strokeWidth={3} /></span>
                      ) : (
                        <span className={`numeral text-[1.75rem] leading-8 ${current ? 'text-copper-600' : 'text-ink-300'}`}>{i + 1}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-3">
                        <span className="text-[17px] font-bold leading-snug text-ink-900 decoration-ink-900 decoration-2 underline-offset-4 group-hover:underline">
                          <span className="sr-only">Lesson {i + 1}: </span>{m.title}
                        </span>
                        <span className="leader hidden sm:block" aria-hidden="true" />
                        <span className={`hidden shrink-0 text-sm font-semibold sm:block ${statusTone}`}>{status}</span>
                      </span>
                      {m.summary ? <span className="mt-1 block text-[15px] leading-snug text-ink-600">{m.summary}</span> : null}
                      <span className={`mt-1.5 block text-[13px] font-semibold sm:hidden ${statusTone}`}>{status}</span>
                    </span>
                    {current ? (
                      <span className="btn-primary btn-sm mt-0.5 hidden sm:inline-flex">
                        {doneCount === 0 ? 'Start' : 'Continue'} <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
                      </span>
                    ) : (
                      <ArrowRight className="nudge mt-1.5 hidden h-4 w-4 shrink-0 text-ink-400 sm:mt-0 sm:block" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ol>

          {/* The final exam closes the list, like the total line of a ledger */}
          <div className="flex flex-col gap-5 border-y-2 border-ink-900 py-6 sm:flex-row sm:items-center sm:py-7">
            <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
              <SubjectArt name="quiz" tone="copper" className="h-9 w-8 sm:h-10 sm:w-10" />
              <div className="min-w-0">
                <p className="text-[13px] font-bold leading-5 text-copper-700">
                  {allLessonsDone ? 'You are ready' : 'Open any time'}
                </p>
                <h2
                  className="font-display text-[1.375rem] font-semibold leading-tight text-ink-900 sm:text-[1.625rem]"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Final exam: full Reading set
                </h2>
                <p className="mt-1.5 max-w-[58ch] text-[15px] leading-snug text-ink-600">
                  Timed, with an estimated band score.
                  {!allLessonsDone ? ` Tip: you will score better after the lessons above (${left} still to do).` : ''}
                </p>
              </div>
            </div>
            <Link href={`/practice/reading/${READING_EXAM_ITEM_ID}`} className="btn-copper group w-full shrink-0 sm:w-auto">
              Start the exam <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
