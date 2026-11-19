// app/practice/speaking/[itemId]/page.js
//
// One IELTS Speaking task: what will happen (in plain words), the questions or
// Part 2 cue card, and the in-browser recorder. Auth-gated via the
// server-side Supabase client.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Clock, Ear, Hourglass, Mic, MicVocal, Send, ShieldCheck } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
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

const STEPS = [
  { icon: Mic, title: 'Allow the microphone', body: 'Your browser will ask once. Choose “Allow”.' },
  { icon: MicVocal, title: 'Record your answer', body: 'Press the microphone, speak, then press stop.' },
  { icon: Ear, title: 'Listen back', body: 'Play it to check it sounds clear. Record again if you like.' },
  { icon: Send, title: 'Send for feedback', body: 'You get a band score for each of the four criteria.' },
]

function fmtMinutes(seconds) {
  if (seconds % 60 === 0) return `${seconds / 60} min`
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
    <div className="container-read py-10">
      <div className="card card-pad text-center">
        <span className="icon-tile mx-auto bg-ink-50 text-ink-500"><Mic className="h-5 w-5" aria-hidden="true" /></span>
        <h1 className="h-section mt-4">This task is not available</h1>
        <p className="mt-1 text-ink-500">It may have been removed or is not published yet.</p>
        <Link href="/practice" className="btn-primary mt-5">Choose another task</Link>
      </div>
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
  // The cue card's last line repeats the timing; we show timing separately.
  const cardTail = isCueCard ? tail.filter((t) => !/prepare|minute/i.test(t)) : tail
  // "You should say:" is drawn as its own label above the bullets.
  const cardLead = isCueCard ? lead.filter((l) => !/^you should say:?$/i.test(l)) : lead

  return (
    <div className="container-read py-6 sm:py-10">
      <Link href="/practice" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> IELTS practice
      </Link>

      <div className="mt-2 flex items-start gap-4">
        <span className="icon-tile hidden bg-teal-50 text-teal-700 sm:flex"><Mic className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">IELTS Speaking</p>
          <h1 className="h-page mt-1">{payload.title || 'Speaking task'}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip-teal">{part.label}</span>
            {prepSeconds ? <span className="chip"><Hourglass className="h-3.5 w-3.5" aria-hidden="true" /> {fmtMinutes(prepSeconds)} to prepare</span> : null}
            <span className="chip"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> Speak up to {fmtMinutes(maxSeconds)}</span>
          </div>
          {part.intro ? <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{part.intro}</p> : null}
        </div>
      </div>

      {/* The task */}
      <section aria-labelledby="task-heading" className="mt-6">
        {isCueCard ? (
          <div className="relative rounded-2xl border-2 border-dashed border-teal-300 bg-white p-5 shadow-card sm:p-7">
            <p id="task-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Cue card</p>
            {cardLead.map((l, i) => (
              <p key={i} className="mt-2 font-display text-xl font-semibold leading-snug text-ink-900 sm:text-2xl">{l}</p>
            ))}
            {bullets.length ? (
              <>
                <p className="mt-4 text-sm font-semibold text-ink-500">You should say:</p>
                <ul className="mt-2 space-y-2">
                  {bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-[16px] leading-relaxed text-ink-800">
                      <span className="mt-[9px] h-2 w-2 shrink-0 rounded-full bg-teal-600" aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {cardTail.map((t, i) => (
              <p key={i} className="mt-3 text-[16px] font-medium leading-relaxed text-ink-800">{t}</p>
            ))}
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-sun-50 px-4 py-3 text-sm text-ink-700">
              <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-sun-600" aria-hidden="true" />
              <span>
                In the exam you get {prepSeconds ? fmtMinutes(prepSeconds) : 'one minute'} to prepare and may make notes, then you speak for 1–2 minutes.
                Use the preparation timer below if you want to practise this.
              </span>
            </p>
          </div>
        ) : (
          <div className="card card-pad">
            <h2 id="task-heading" className="text-xs font-semibold uppercase tracking-wider text-ink-400">The questions</h2>
            {lead.map((l, i) => (
              <p key={i} className="mt-2 text-[17px] font-medium leading-relaxed text-ink-900">{l}</p>
            ))}
            {bullets.length ? (
              <ol className="mt-3 space-y-2.5">
                {bullets.map((b, i) => (
                  <li key={b} className="flex gap-3 text-[16px] leading-relaxed text-ink-800">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">{i + 1}</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ol>
            ) : null}
            {tail.map((t, i) => <p key={i} className="mt-3 text-[16px] text-ink-800">{t}</p>)}
          </div>
        )}
      </section>

      {/* What happens */}
      <section aria-labelledby="how-heading" className="mt-6">
        <h2 id="how-heading" className="h-section">How it works</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-2xl bg-white p-3.5 shadow-card">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{s.title}</p>
                <p className="text-sm text-ink-500">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Recorder" className="mt-6">
        <Recorder itemId={item.id} maxSeconds={maxSeconds} prepSeconds={prepSeconds} />
      </section>

      <p className="mt-6 flex items-start gap-2 text-sm text-ink-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Your recording is saved privately to your account so you can play it back with your feedback. Find a quiet place and hold your phone about 20 cm from your mouth.
      </p>
    </div>
  )
}
