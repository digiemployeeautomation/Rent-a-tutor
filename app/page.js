// app/page.js — public landing page.
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import HeroCta from '@/components/marketing/HeroCta'
import SampleQuestion from '@/components/marketing/SampleQuestion'
import SiteFooter from '@/components/marketing/SiteFooter'
import ChalkDoodles from '@/components/art/ChalkDoodles'
import SubjectArt from '@/components/art/SubjectArt'
import BandScale from '@/components/kit/BandScale'
import { getSubjects } from '@/lib/highschool/catalog'

const FACTS = ['Completely free. No payments.', 'No sign-up needed for the demo', 'Lessons work offline']

const IELTS_SKILLS = [
  { slug: 'listening', name: 'Listening', note: 'Answer questions as you listen to a recording.' },
  { slug: 'reading', name: 'Reading', note: '5 strategy lessons, drills and a timed mock exam.' },
  { slug: 'writing', name: 'Writing', note: 'Band feedback on each criterion.' },
  { slug: 'speaking', name: 'Speaking', note: 'Record your answer to an examiner question.' },
]

const STEPS = [
  { title: 'Learn in short steps', body: 'One idea per screen, with worked examples that show every step. No long pages to scroll.' },
  { title: 'Check as you go', body: 'Answer a quick question after each idea and see straight away why the answer is right.' },
  { title: 'Finish with a quiz', body: 'Every lesson ends with an 8-question quiz. Passed lessons are marked done on your subject page.' },
]

const OFFLINE = [
  { title: 'Save to your device', body: 'Tap “Save for offline” on a lesson while you have a connection. It then opens with no internet, quick checks and quiz included.' },
  { title: 'Find it in Downloads', body: 'Every lesson you save is listed in the Downloads tab, ready to open.' },
  { title: 'Download a single file', body: 'Get a lesson as one file to share with classmates or print for class.' },
]

export default function HomePage() {
  const subjects = getSubjects()
  const lessonCount = subjects.reduce((n, s) => n + s.lessonCount, 0)

  return (
    <div>
      {/* ── Hero: the headline, and the chalkboard with a real question ── */}
      <section className="container-app grid gap-12 pb-4 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:items-start lg:gap-12 lg:pt-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,532px)]">
        <div className="stagger lg:pt-6">
          <p className="eyebrow animate-fade-in-up">Zambian high school · IELTS preparation</p>
          <h1 className="h-display mt-4 animate-fade-in-up lg:text-[3.5rem] xl:text-[3.875rem]">
            <span className="block">Learn it</span>
            <span className="block"><mark className="hl">step by step.</mark></span>
            <span className="block">Understand it</span>
            <span className="block">for good.</span>
          </h1>
          <p className="lead mt-6 max-w-[46ch] animate-fade-in-up">
            Clear lessons for Forms 1 to 4 and IELTS, with a quick check after every idea and instant feedback. On any phone, even offline.
          </p>
          <div className="mt-8 animate-fade-in-up">
            <HeroCta />
          </div>
          <ul className="mt-8 animate-fade-in-up space-y-2 text-[15px] font-semibold text-ink-700">
            {FACTS.map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <Check className="h-4 w-4 shrink-0 text-board-600" strokeWidth={3} aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative isolate animate-fade-in-up [animation-delay:160ms]">
          <div className="board !absolute inset-x-0 bottom-7 top-0 -z-10 lg:bottom-10 lg:left-8">
            <ChalkDoodles opacity={0.24} className="!-right-10 !top-1 !h-[203px] !translate-y-0" />
          </div>
          <div className="px-5 pt-6 sm:px-8 sm:pt-8 lg:pl-16">
            <p className="text-[13px] font-bold text-sun-300">Try it now</p>
            <p className="mt-1.5 font-display text-[1.5rem] font-semibold leading-[1.12] text-chalk sm:max-w-[10ch] sm:text-[1.75rem]" style={{ letterSpacing: '-0.02em' }}>
              Answer a real question.
            </p>
            <p className="board-soft mt-2 text-sm leading-snug sm:max-w-[22ch]">
              From the Form 1 lesson “What is a fraction?”
            </p>
          </div>
          <div className="mx-3 mt-6 sm:mx-8 sm:mt-9 lg:ml-0 lg:mr-8">
            <SampleQuestion />
          </div>
        </div>
      </section>

      {/* ── The two courses ───────────────────────────────────────────── */}
      <section className="container-app mt-16 sm:mt-24" aria-labelledby="courses-title">
        <div className="max-w-2xl">
          <h2 id="courses-title" className="h-page text-balance">Two courses, taught the same clear way.</h2>
          <p className="lead mt-3">Pick the one you need. Both use the same simple lesson style, so you always know what to do next.</p>
        </div>

        <div className="mt-10 grid gap-x-14 gap-y-14 sm:mt-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          {/* High School: a contents list */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-board-700 pb-2.5">
              <h3 className="font-display text-[1.5rem] font-semibold leading-tight text-ink-900 sm:text-[1.75rem]" style={{ letterSpacing: '-0.02em' }}>High School</h3>
              <p className="text-[13px] font-semibold text-ink-500">Zambian O-Level syllabus · Forms 1 to 4</p>
            </div>
            <ul className="rows">
              {subjects.map((s) => (
                <li key={s.slug}>
                  <Link href={`/learn/high-school/${s.slug}`} className="group flex min-h-[64px] items-center gap-4 py-2.5">
                    <SubjectArt name={s.slug} className="h-11 w-11" />
                    <span className="flex min-w-0 flex-1 items-baseline gap-3">
                      <span className="text-[17px] font-bold leading-snug text-ink-900 decoration-ink-900 decoration-2 underline-offset-4 group-hover:underline">{s.name}</span>
                      <span className="leader" aria-hidden="true" />
                      <span className="shrink-0 text-sm font-semibold text-ink-500 tabular">
                        <span className="hidden sm:inline">Form {s.forms.join(', ')} · </span>{s.lessonCount} lessons<span className="hidden sm:inline"> · {s.minutes} min</span>
                      </span>
                    </span>
                    <ArrowRight className="nudge h-4 w-4 shrink-0 text-board-700" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-[56ch] text-[15px] leading-relaxed text-ink-600">
              This demo has {lessonCount} sample lessons across {subjects.length} subjects. It is not the full curriculum yet: more topics are added as they are written and reviewed.
            </p>
            <Link href="/learn/high-school" className="group mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-[15px] font-bold text-board-700 hover:text-board-900">
              Browse all lessons <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* IELTS: the four skills */}
          <div id="ielts" className="scroll-mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-copper-600 pb-2.5">
              <h3 className="font-display text-[1.5rem] font-semibold leading-tight text-ink-900 sm:text-[1.75rem]" style={{ letterSpacing: '-0.02em' }}>IELTS</h3>
              <p className="text-[13px] font-semibold text-ink-500">All four parts of the test</p>
            </div>
            <ul className="rows">
              {IELTS_SKILLS.map((k) => (
                <li key={k.slug} className="flex items-start gap-4 py-3.5">
                  <SubjectArt name={k.slug} tone="copper" className="h-11 w-11" />
                  <div className="min-w-0">
                    <p className="text-[17px] font-bold leading-snug text-ink-900">{k.name}</p>
                    <p className="mt-0.5 text-[15px] leading-snug text-ink-600">{k.note}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <p className="text-[13px] font-semibold text-ink-500">Scores sit on the real band scale. Example: 6.5, with a target of 7.</p>
              <BandScale band={6.5} target={7} className="mt-1.5" />
            </div>
            <p className="mt-6 text-[15px] leading-relaxed text-ink-600">
              You see an estimated band score straight away. Writing and Speaking marking may show sample feedback in this demo. IELTS practice needs an account, and the demo gives you one.
            </p>
            <Link href="/demo" className="group mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-[15px] font-bold text-copper-700 hover:text-copper-900">
              Try IELTS in the demo <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How a lesson works ───────────────────────────────────────── */}
      <section className="container-app mt-20 grid gap-x-14 gap-y-8 sm:mt-28 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]" aria-labelledby="how-title">
        <div>
          <h2 id="how-title" className="h-page text-balance">Small steps, so nobody gets lost.</h2>
          <p className="mt-3 max-w-[40ch] text-[17px] leading-[1.55] text-ink-600">
            Each lesson takes about 20 minutes and is made for reading on a phone.
          </p>
        </div>
        <ol className="border-t-2 border-ink-900">
          {STEPS.map(({ title, body }, i) => (
            <li key={title} className="flex items-start gap-5 border-b border-ink-200 py-5 sm:gap-8 sm:py-6">
              <span className="numeral w-10 shrink-0 text-[3rem] leading-[0.9] text-copper-600 sm:w-14 sm:text-[4rem]" aria-hidden="true">{i + 1}</span>
              <div className="pt-0.5 sm:pt-1.5">
                <h3 className="font-sans text-[19px] font-bold leading-snug text-ink-900">{title}</h3>
                <p className="mt-1 max-w-[54ch] text-base leading-relaxed text-ink-600">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Offline ──────────────────────────────────────────────────── */}
      <section id="offline" className="mt-20 scroll-mt-16 border-y border-ink-200 bg-white sm:mt-28" aria-labelledby="offline-title">
        <div className="container-app grid gap-x-14 gap-y-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <SubjectArt name="offline" className="h-24 w-24 sm:h-32 sm:w-32" />
            <h2 id="offline-title" className="h-page mt-6 text-balance">No internet? <mark className="hl">Keep learning.</mark></h2>
            <p className="mt-3 max-w-[42ch] text-[17px] leading-[1.55] text-ink-600">
              Save lessons while you have a connection, then study anywhere: at home, on the bus, or where data is expensive.
            </p>
          </div>
          <div>
            <dl className="border-t-2 border-ink-900">
              {OFFLINE.map(({ title, body }) => (
                <div key={title} className="grid gap-x-8 gap-y-1 border-b border-ink-200 py-4 sm:grid-cols-[200px_1fr] sm:py-5">
                  <dt className="text-[17px] font-bold leading-snug text-ink-900">{title}</dt>
                  <dd className="text-base leading-relaxed text-ink-600">{body}</dd>
                </div>
              ))}
            </dl>
            <Link href="/downloads" className="btn-secondary group mt-6">
              See Downloads <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Closing call to action ───────────────────────────────────── */}
      <section className="container-app mt-16 sm:mt-24" aria-labelledby="cta-title">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="cta-title" className="h-display max-w-[18ch] text-balance !text-[clamp(2.125rem,1.4rem+3vw,3.5rem)]">See it for yourself in one click.</h2>
            <p className="lead mt-4 max-w-[44ch]">
              The demo opens a ready-made student account. No forms and no email. Just start learning.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:pb-1">
            <Link href="/demo" className="btn-primary btn-lg group">
              Try the demo <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
            </Link>
            <Link href="/auth/register" className="btn-secondary btn-lg">Create an account</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
