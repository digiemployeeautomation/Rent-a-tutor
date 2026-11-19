// app/practice/speaking/[itemId]/page.js
//
// One IELTS Speaking task: the examiner's questions or the Part 2 cue card on
// a sheet of paper, then the in-browser recorder. Auth-gated via the
// server-side Supabase client.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import SubjectArt from '@/components/art/SubjectArt'
import Recorder from '@/components/practice/Recorder'

export const metadata = { title: 'IELTS Speaking practice' }

const PARTS = {
  'speaking-part-1': {
    label: 'Part 1 · Interview',
    intro: 'Answer each question in two or three sentences, as if you were chatting with the examiner. Record all your answers in one go.',
    maxSeconds: 90,
  },
  'speaking-part-2': {
    label: 'Part 2 · Cue card',
    intro: 'Read the card, take one minute to prepare, then talk for one to two minutes covering every point.',
    maxSeconds: 120,
  },
  'speaking-part-3': {
    label: 'Part 3 · Discussion',
    intro: 'Give longer answers with reasons and examples, as in a discussion. Record all your answers in one go.',
    maxSeconds: 150,
  },
}

function fmtMinutes(seconds) {
  if (seconds % 60 === 0) return `${seconds / 60} minute${seconds === 60 ? '' : 's'}`
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`
}

// Split a prompt like "Intro.\n\n• q1\n• q2" into lead text and bullet items.
function parsePrompt(prompt) {
  const lines = String(prompt ?? '').split('\n')
  const lead = []
  const bullets = []
  const tail = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (/^[•\-*]\s*/.test(line)) bullets.push(line.replace(/^[•\-*]\s*/, ''))
    else if (bullets.length) tail.push(line)
    else lead.push(line)
  }
  return { lead, bullets, tail }
}

function NotFound() {
  return (
    <div className="container-read py-16 text-center sm:py-24">
      <SubjectArt name="speaking" tone="copper" className="mx-auto h-24 w-24" />
      <h1 className="h-section mt-6">This task is not available</h1>
      <p className="mx-auto mt-2 max-w-sm text-[17px] leading-relaxed text-ink-600">It may have been removed, or it is not published yet.</p>
      <Link href="/practice" className="btn-primary mt-6">Choose another task</Link>
    </div>
  )
}

export default async function SpeakingPracticePage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?redirectTo=/practice/speaking/${params.itemId}`)
  }

  const { data: item, error } = await supabase
    .from('practice_items')
    .select('id, type, sub_skill, variant, payload, status')
    .eq('id', params.itemId)
    .maybeSingle()

  if (error || !item || item.status !== 'published' || item.type !== 'speaking_task') {
    return <NotFound />
  }

  const payload = item.payload ?? {}
  const part = PARTS[item.sub_skill] ?? { label: 'Speaking', intro: '', maxSeconds: 120 }
  const isCueCard = item.sub_skill === 'speaking-part-2'
  const maxSeconds = Number(payload.speak_seconds) > 0 ? Number(payload.speak_seconds) : part.maxSeconds
  const prepSeconds = Number(payload.prep_seconds) > 0 ? Number(payload.prep_seconds) : 0
  const { lead, bullets, tail } = parsePrompt(payload.prompt)
  // The cue card's last line repeats the timing; the sheet states it at the top.
  const cardTail = isCueCard ? tail.filter((t) => !/prepare|minute/i.test(t)) : tail
  // "You should say:" is drawn as its own label above the bullets.
  const cardLead = isCueCard ? lead.filter((l) => !/^you should say:?$/i.test(l)) : lead

  return (
    <div className="container-read pb-16 pt-6 sm:pt-10">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS practice
      </Link>

      <header className="mt-3 flex items-start justify-between gap-6 sm:mt-5">
        <div className="min-w-0">
          <p className="eyebrow !text-copper-700">IELTS Speaking · {part.label}</p>
          <h1 className="h-page mt-2 text-balance">{payload.title || 'Speaking task'}</h1>
          {part.intro ? <p className="lead mt-3">{part.intro}</p> : null}
        </div>
        <SubjectArt name="speaking" tone="copper" className="hidden h-20 w-20 sm:block" />
      </header>

      {/* The task */}
      <section aria-labelledby="task-heading" className="sheet mt-8 p-6 sm:mt-10 sm:p-9">
        {isCueCard ? (
          <>
            <h2 id="task-heading" className="sr-only">Cue card</h2>
            <p className="border-b border-ink-200 pb-4 text-[15px] leading-relaxed text-ink-600">
              In the exam you get <strong className="font-bold text-ink-900">{prepSeconds ? fmtMinutes(prepSeconds) : '1 minute'}</strong> to prepare and may make notes.
              Then you speak for <strong className="font-bold text-ink-900">1 to 2 minutes</strong>.
            </p>
            {cardLead.map((l, i) => (
              <p key={i} className="mt-5 text-pretty font-display text-[1.375rem] font-semibold leading-[1.35] text-ink-900 sm:text-[1.625rem]">{l}</p>
            ))}
            {bullets.length ? (
              <>
                <p className="mt-6 text-[15px] font-bold text-ink-900">You should say:</p>
                <ul className="mt-2 space-y-1.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-[17px] leading-relaxed text-ink-800">
                      <span className="mt-[0.72em] h-1.5 w-1.5 shrink-0 bg-copper-600" aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {cardTail.map((t, i) => (
              <p key={i} className="mt-3 text-[17px] leading-relaxed text-ink-800">{t}</p>
            ))}
          </>
        ) : (
          <>
            <h2 id="task-heading" className="sr-only">The questions</h2>
            <p className="text-[15px] leading-relaxed text-ink-600">The examiner says:</p>
            {lead.map((l, i) => (
              <p key={i} className="mt-2 text-pretty font-display text-[1.25rem] font-medium leading-[1.5] text-ink-900 sm:text-[1.375rem]">{l}</p>
            ))}
            {bullets.length ? (
              <ol className="mt-5 divide-y divide-ink-200 border-t border-ink-200">
                {bullets.map((b, i) => (
                  <li key={b} className="flex items-baseline gap-4 py-3.5 text-[17px] leading-snug text-ink-900">
                    <span className="numeral w-5 shrink-0 text-[1.375rem] leading-none text-copper-600" aria-hidden="true">{i + 1}</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ol>
            ) : null}
            {tail.map((t, i) => <p key={i} className="mt-4 text-[17px] leading-relaxed text-ink-800">{t}</p>)}
          </>
        )}
      </section>

      <section aria-labelledby="recorder-heading" className="mt-12 sm:mt-14">
        <div className="rule-head">
          <h2 id="recorder-heading" className="h-section">Your answer</h2>
          <p className="shrink-0 text-[13px] font-semibold text-ink-500">Record, listen back, then send</p>
        </div>
        <div className="mt-5">
          <Recorder itemId={item.id} maxSeconds={maxSeconds} prepSeconds={prepSeconds} />
        </div>
      </section>

      <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-ink-600">
        Your recording is saved privately to your account so you can play it back with your feedback.
        Find a quiet place and hold your phone about 20 cm from your mouth.
      </p>
    </div>
  )
}
