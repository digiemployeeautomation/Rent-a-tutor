// app/page.js — public landing page.
import Link from 'next/link'
import {
  ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, FileDown, GraduationCap, Headphones,
  Languages, Layers, Lightbulb, Mic, PenLine, Smartphone, KeyRound, Trophy, WifiOff,
} from 'lucide-react'
import HeroCta from '@/components/marketing/HeroCta'
import PhoneMock from '@/components/marketing/PhoneMock'
import SampleQuestion from '@/components/marketing/SampleQuestion'
import SiteFooter from '@/components/marketing/SiteFooter'
import SubjectIcon from '@/components/highschool/SubjectIcon'
import { SUBJECTS } from '@/lib/highschool/subjects'

const HS_POINTS = [
  'Short, step-by-step lessons in plain English',
  'Worked examples that show every step',
  'Quick checks with explanations, and an 8-question quiz to finish each lesson',
]

const IELTS_SECTIONS = [
  { name: 'Listening', icon: Headphones },
  { name: 'Reading', icon: BookOpen },
  { name: 'Writing', icon: PenLine },
  { name: 'Speaking', icon: Mic },
]

const IELTS_POINTS = [
  'Instant band-score feedback on your answers',
  '5 reading strategy lessons, plus drills for every reading question type',
  'A timed reading mock exam that gives an estimated band',
]

const STEPS = [
  { icon: Layers, title: 'Learn in short steps', body: 'One idea per screen, with pictures where they help. No long pages to scroll.' },
  { icon: Lightbulb, title: 'See worked examples', body: 'Every method is shown step by step with real numbers and real situations.' },
  { icon: ClipboardCheck, title: 'Check as you go', body: 'Answer a quick question after each idea and see straight away why the answer is right.' },
  { icon: Trophy, title: 'Quiz and track progress', body: 'Finish with an 8-question quiz. Passed lessons are marked done on your subject page.' },
]

export default function HomePage() {
  return (
    <div className="bg-paper">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '28px 28px' }}
          aria-hidden="true"
        />
        <div className="container-app relative grid items-center gap-14 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:gap-8 lg:pb-24 lg:pt-20">
          <div className="animate-fade-in-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-ink-100">
              <span className="h-1.5 w-1.5 rounded-full bg-sun-400" aria-hidden="true" />
              Zambian high school · IELTS preparation
            </p>
            <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[3.3rem]">
              Learn it step by step. <span className="text-sun-400">Understand</span> it for good.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-200">
              Clear lessons for Forms 1–4 and IELTS, with a quick check after every idea and instant feedback — on any phone, even offline.
            </p>
            <div className="mt-8">
              <HeroCta />
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-200">
              {['Completely free — no payments', 'No sign-up needed for the demo', 'Lessons work offline'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sun-400" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="px-6 sm:px-0">
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* ── Courses ──────────────────────────────────────────── */}
      <section className="container-app py-16 sm:py-24" aria-labelledby="courses-title">
        <div className="max-w-2xl">
          <p className="eyebrow">Two courses</p>
          <h2 id="courses-title" className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            One place for school subjects and IELTS
          </h2>
          <p className="lead mt-3">Pick the course you need. Both use the same simple lesson style, so you always know what to do next.</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {/* High School */}
          <Link href="/learn/high-school" className="card card-hover group flex flex-col overflow-hidden">
            <div className="border-b border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="icon-tile bg-blue-600 text-white"><GraduationCap className="h-5 w-5" aria-hidden="true" /></span>
                <span className="chip-blue">Forms 1–4</span>
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold text-ink-900">High School</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
                The Zambian O-Level syllabus, taught one clear step at a time.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <li key={s.slug} className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-[13px] font-medium text-ink-700">
                    <SubjectIcon name={s.icon} className="h-3.5 w-3.5 text-blue-600" /> {s.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <ul className="space-y-3">
                {HS_POINTS.map((p) => (
                  <li key={p} className="flex gap-3 text-[15px] text-ink-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" /> {p}
                  </li>
                ))}
              </ul>
              <p className="muted mt-5">This demo has 5 subjects and 15 lessons.</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-blue-700">
                Browse lessons <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </Link>

          {/* IELTS */}
          <Link id="ielts" href="/demo" className="card card-hover group flex scroll-mt-24 flex-col overflow-hidden">
            <div className="border-b border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="icon-tile bg-teal-600 text-white"><Languages className="h-5 w-5" aria-hidden="true" /></span>
                <span className="chip-teal">All 4 sections</span>
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold text-ink-900">IELTS preparation</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
                Practise every part of the test and see an estimated band score straight away.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {IELTS_SECTIONS.map(({ name, icon: Icon }) => (
                  <li key={name} className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-[13px] font-medium text-ink-700">
                    <Icon className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" /> {name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <ul className="space-y-3">
                {IELTS_POINTS.map((p) => (
                  <li key={p} className="flex gap-3 text-[15px] text-ink-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" aria-hidden="true" /> {p}
                  </li>
                ))}
              </ul>
              <p className="muted mt-5 flex items-center gap-1.5"><KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" /> IELTS practice needs an account — the demo gives you one.</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-teal-700">
                Try IELTS in the demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── How a lesson works ───────────────────────────────── */}
      <section className="border-y border-ink-100 bg-white py-16 sm:py-24" aria-labelledby="how-title">
        <div className="container-app">
          <div className="max-w-2xl">
            <p className="eyebrow">How a lesson works</p>
            <h2 id="how-title" className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Small steps, so nobody gets lost
            </h2>
            <p className="lead mt-3">Each lesson takes about 20 minutes and is made for reading on a phone.</p>
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-4 rounded-2xl border border-ink-100 bg-paper p-5 sm:flex-col sm:gap-0 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="icon-tile bg-white text-blue-600 shadow-card"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="hidden font-display text-3xl font-bold text-ink-200 sm:block">{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-900 sm:mt-5">
                    <span className="mr-1.5 text-blue-600 sm:hidden">{i + 1}.</span>{title}
                  </h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-500 sm:mt-1.5">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Live sample ──────────────────────────────────────── */}
      <section className="container-app py-16 sm:py-24" aria-labelledby="try-title">
        <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="lg:pt-6">
            <p className="eyebrow">Try it now</p>
            <h2 id="try-title" className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Answer a real question from a lesson
            </h2>
            <p className="lead mt-3">
              This quick check comes from <span className="font-semibold text-ink-700">What is a fraction?</span> in Form 1 Mathematics. Pick an answer and check it — you get the explanation straight away, just like in the lesson.
            </p>
            <Link href="/learn/high-school/mathematics/1-what-is-a-fraction" className="mt-6 hidden items-center gap-1.5 text-[15px] font-semibold text-blue-700 hover:text-blue-800 lg:inline-flex">
              Open the whole lesson <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <SampleQuestion />
        </div>
      </section>

      {/* ── Offline ──────────────────────────────────────────── */}
      <section id="offline" className="scroll-mt-20 pb-16 sm:pb-24" aria-labelledby="offline-title">
        <div className="container-app">
          <div className="overflow-hidden rounded-3xl bg-ink-900 text-white">
            <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:p-14">
              <div>
                <span className="icon-tile bg-white/10 text-sun-400"><WifiOff className="h-5 w-5" aria-hidden="true" /></span>
                <h2 id="offline-title" className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  No internet? Keep learning.
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-ink-200">
                  Save lessons while you have a connection, then study anywhere — at home, on the bus, or where data is expensive.
                </p>
                <Link href="/downloads" className="btn-accent mt-7">
                  See Downloads <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex gap-4">
                    <span className="icon-tile bg-sun-400 text-ink-900"><Smartphone className="h-5 w-5" aria-hidden="true" /></span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-white">Save to your phone</h3>
                      <p className="mt-1 text-[15px] leading-relaxed text-ink-200">
                        Saved lessons open with no internet at all, quick checks and quiz included.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex gap-4">
                    <span className="icon-tile bg-white text-ink-900"><FileDown className="h-5 w-5" aria-hidden="true" /></span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-white">Download a file</h3>
                      <p className="mt-1 text-[15px] leading-relaxed text-ink-200">
                        Get a lesson as a single file to share with classmates or print for class.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="border-t border-ink-100 bg-white">
        <div className="container-app py-16 text-center sm:py-20">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            See it for yourself in one click
          </h2>
          <p className="lead mx-auto mt-3 max-w-xl">
            The demo opens a ready-made student account. No forms, no email — just start learning.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/demo" className="btn-primary btn-lg">
              Try the live demo <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link href="/auth/register" className="btn-secondary btn-lg">Create an account</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
