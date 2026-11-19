// app/practice/writing/[itemId]/page.js
//
// One IELTS Writing task, set out like the exam: the question paper (with
// Task 1 chart data drawn as a chart + table) beside the answer sheet.
// Auth-gated via the server-side Supabase client.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import SubjectArt from '@/components/art/SubjectArt'
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
      'Give an overview of the main trends. You do not need to list every number.',
      'Compare groups and years, using a few key figures as evidence.',
    ],
  },
  'writing-task-1-general': {
    label: 'Task 1 · General Training',
    minutes: 20,
    words: 150,
    tips: [
      'Cover every bullet point. Each one is part of your mark.',
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
      'Use 4 or 5 paragraphs: introduction, two or three body paragraphs, conclusion.',
      'Support each main idea with a reason and an example.',
    ],
  },
}

// Turn the prompt text into paragraphs and bullet lists. The closing "Write at
// least N words." line is dropped because the sheet states it at the top, the
// way the exam paper does.
function promptBlocks(text) {
  const blocks = []
  for (const para of String(text ?? '').split(/\n{2,}/)) {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean)
    let plain = []
    let bullets = []
    const flush = () => {
      if (plain.length) blocks.push({ type: 'p', text: plain.join(' ') })
      if (bullets.length) blocks.push({ type: 'ul', items: bullets })
      plain = []
      bullets = []
    }
    for (const line of lines) {
      if (/^[•\-*]\s+/.test(line)) bullets.push(line.replace(/^[•\-*]\s+/, ''))
      else {
        if (bullets.length) flush()
        plain.push(line)
      }
    }
    flush()
  }
  return blocks.filter((b) => !(b.type === 'p' && /^write at least \d+ words\.?$/i.test(b.text)))
}

function NotFound() {
  return (
    <div className="container-read py-16 text-center sm:py-24">
      <SubjectArt name="writing" tone="copper" className="mx-auto h-24 w-24" />
      <h1 className="h-section mt-6">This task is not available</h1>
      <p className="mx-auto mt-2 max-w-sm text-[17px] leading-relaxed text-ink-600">It may have been removed, or it is not published yet.</p>
      <Link href="/practice" className="btn-primary mt-6">Choose another task</Link>
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
  const blocks = promptBlocks(promptText)

  return (
    <div className="container-app pb-16 pt-6 sm:pt-10">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS practice
      </Link>

      <header className="mt-3 flex items-end justify-between gap-6 sm:mt-5">
        <div className="min-w-0">
          <p className="eyebrow !text-copper-700">IELTS Writing · {task.label}</p>
          <h1 className="h-page mt-2 text-balance">{payload.title || 'Writing task'}</h1>
        </div>
        <SubjectArt name="writing" tone="copper" className="hidden h-20 w-20 sm:block" />
      </header>

      <div className="mt-6 grid gap-10 sm:mt-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] lg:items-start lg:gap-12">
        {/* The question paper */}
        <section aria-labelledby="task-heading" className="sheet lg:sticky lg:top-20">
          <div className="p-6 sm:p-8">
            <h2 id="task-heading" className="sr-only">The task</h2>
            <p className="border-b border-ink-200 pb-4 text-[15px] leading-relaxed text-ink-600">
              You should spend about <strong className="font-bold text-ink-900">{minutes} minutes</strong> on this task.
              Write at least <strong className="font-bold text-ink-900">{minimumWords} words</strong>.
            </p>

            <div className="mt-5 space-y-4 font-display text-[1.25rem] font-medium leading-[1.5] text-ink-900">
              {blocks.map((b, i) => b.type === 'ul' ? (
                <ul key={i} className="space-y-1.5">
                  {b.items.map((it) => (
                    <li key={it} className="flex gap-3">
                      <span className="mt-[0.72em] h-1.5 w-1.5 shrink-0 bg-copper-600" aria-hidden="true" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={i} className="text-pretty">{b.text}</p>
              ))}
            </div>

            {data ? <div className="mt-7 border-t border-ink-200 pt-6"><TaskDataView data={data} /></div> : null}

            {task.tips.length ? (
              <details className="group mt-7 border-t border-ink-200 pt-1">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
                  Tips for this task
                  <ChevronDown className="h-4 w-4 text-ink-500 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ol className="space-y-2.5 pb-1 pt-1">
                  {task.tips.map((t, i) => (
                    <li key={t} className="flex items-baseline gap-3 text-[15px] leading-relaxed text-ink-700">
                      <span className="numeral w-4 shrink-0 text-lg leading-none text-copper-600" aria-hidden="true">{i + 1}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}
          </div>
        </section>

        {/* The answer sheet */}
        <SubmissionForm itemId={item.id} minimumWords={minimumWords} suggestedMinutes={minutes} />
      </div>
    </div>
  )
}
