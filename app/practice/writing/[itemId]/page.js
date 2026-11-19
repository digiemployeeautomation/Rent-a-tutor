// app/practice/writing/[itemId]/page.js
//
// One IELTS Writing task: the task card (with Task 1 chart data drawn as a
// chart + table) and the editor. Auth-gated via the server-side Supabase client.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Clock, FileText, Lightbulb, PenLine } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { splitTaskData, TaskDataView } from '@/components/ielts/WritingTaskData'
import SubmissionForm from './SubmissionForm'

export const metadata = { title: 'IELTS Writing practice' }

const TASKS = {
  'writing-task-1-academic': {
    label: 'Task 1 · Academic',
    minutes: 20,
    words: 150,
    tips: [
      'Start with one sentence saying what the chart shows.',
      'Give an overview of the main trends — no need to list every number.',
      'Compare groups and years, using a few key figures as evidence.',
    ],
  },
  'writing-task-1-general': {
    label: 'Task 1 · General Training',
    minutes: 20,
    words: 150,
    tips: [
      'Cover every bullet point — each one is part of your mark.',
      'Match the tone to the reader (friendly, polite or formal).',
      'Open with "Dear …" and close in a way that fits the tone.',
    ],
  },
  'writing-task-2': {
    label: 'Task 2 · Essay',
    minutes: 40,
    words: 250,
    tips: [
      'Answer the exact question and make your opinion clear.',
      'Use 4–5 paragraphs: introduction, two or three body paragraphs, conclusion.',
      'Support each main idea with a reason and an example.',
    ],
  },
}

function NotFound() {
  return (
    <div className="container-read py-10">
      <div className="card card-pad text-center">
        <span className="icon-tile mx-auto bg-ink-50 text-ink-500"><FileText className="h-5 w-5" aria-hidden="true" /></span>
        <h1 className="h-section mt-4">This task is not available</h1>
        <p className="mt-1 text-ink-500">It may have been removed or is not published yet.</p>
        <Link href="/practice" className="btn-primary mt-5">Choose another task</Link>
      </div>
    </div>
  )
}

export default async function WritingPracticePage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?redirectTo=/practice/writing/${params.itemId}`)
  }

  const { data: item, error } = await supabase
    .from('practice_items')
    .select('id, type, sub_skill, variant, payload, status')
    .eq('id', params.itemId)
    .maybeSingle()

  if (error || !item || item.status !== 'published' || item.type !== 'writing_task') {
    return <NotFound />
  }

  const payload = item.payload ?? {}
  const task = TASKS[item.sub_skill] ?? { label: 'Writing', minutes: 40, words: 250, tips: [] }
  const minimumWords = payload.minimum_words ?? task.words
  const minutes = payload.time_limit_minutes ?? task.minutes
  // Only Academic Task 1 carries chart data inside the prompt text.
  const { promptText, data } = item.sub_skill === 'writing-task-1-academic'
    ? splitTaskData(payload.prompt)
    : { promptText: payload.prompt ?? '', data: null }

  return (
    <div className="container-app py-6 pb-32 sm:py-10 sm:pb-32">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS practice
      </Link>

      <div className="mt-2 flex items-start gap-4">
        <span className="icon-tile hidden bg-teal-50 text-teal-700 sm:flex"><PenLine className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">IELTS Writing</p>
          <h1 className="h-page mt-1">{payload.title || 'Writing task'}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip-teal">{task.label}</span>
            <span className="chip"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> About {minutes} min</span>
            <span className="chip">At least {minimumWords} words</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        {/* Task card */}
        <section aria-labelledby="task-heading" className="card lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <div className="card-pad">
            <h2 id="task-heading" className="text-xs font-semibold uppercase tracking-wider text-ink-400">The task</h2>
            <div className="mt-2 space-y-3">
              {String(promptText).split(/\n{2,}/).map((p, i) => (
                <p key={i} className="whitespace-pre-line text-[16px] leading-relaxed text-ink-800">{p.trim()}</p>
              ))}
            </div>
            {data ? <div className="mt-4"><TaskDataView data={data} /></div> : null}

            {task.tips.length ? (
              <details className="group mt-5 rounded-xl bg-blue-50/60 px-4 py-3">
                <summary className="flex min-h-[28px] cursor-pointer list-none items-center gap-2 text-sm font-semibold text-blue-700">
                  <Lightbulb className="h-4 w-4" aria-hidden="true" /> Tips for this task
                  <span className="ml-auto text-xs font-medium text-blue-600 group-open:hidden">Show</span>
                  <span className="ml-auto hidden text-xs font-medium text-blue-600 group-open:inline">Hide</span>
                </summary>
                <ul className="mt-2 space-y-1.5">
                  {task.tips.map((t) => (
                    <li key={t} className="flex gap-2 text-sm leading-relaxed text-ink-700">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        </section>

        {/* Editor */}
        <SubmissionForm itemId={item.id} minimumWords={minimumWords} suggestedMinutes={minutes} />
      </div>
    </div>
  )
}
