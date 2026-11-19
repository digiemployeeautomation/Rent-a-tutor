// app/about/page.js
import Link from 'next/link'
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, Languages, Smartphone, WifiOff } from 'lucide-react'
import SiteFooter from '@/components/marketing/SiteFooter'

export const metadata = {
  title: 'About',
}

const PRINCIPLES = [
  { icon: BookOpen, title: 'Plain, clear English', body: 'Short sentences and everyday examples, written for students who learn in English as a second language.' },
  { icon: Smartphone, title: 'Phone first', body: 'Every screen is designed for a small phone first, with big buttons and one idea at a time.' },
  { icon: WifiOff, title: 'Light on data', body: 'Lessons can be saved to the phone and opened later with no internet connection.' },
]

const COURSES = [
  {
    icon: GraduationCap,
    tone: 'bg-blue-600 text-white',
    check: 'text-blue-600',
    title: 'High School',
    items: [
      'Zambian O-Level syllabus, Forms 1–4',
      'Mathematics, Biology, Chemistry, Physics and English Language',
      'Step-by-step lessons, worked examples and quick checks',
      'An 8-question quiz at the end of every lesson',
    ],
  },
  {
    icon: Languages,
    tone: 'bg-teal-600 text-white',
    check: 'text-teal-600',
    title: 'IELTS preparation',
    items: [
      'Listening, Reading, Writing and Speaking practice',
      'Instant band-score feedback on your answers',
      'Reading strategy lessons and drills for every question type',
      'A timed reading mock exam with an estimated band',
    ],
  },
]

export default function AboutPage() {
  return (
    <div className="bg-paper">
      <section className="bg-ink-900 text-white">
        <div className="container-read py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">About us</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Good teaching, one clear step at a time
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-200">
            Rent a Tutor is an online tutoring platform for Zambian secondary-school students and IELTS candidates. We turn each topic into short steps, check understanding as you go, and explain every answer.
          </p>
        </div>
      </section>

      <section className="container-read py-14 sm:py-16">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">How we build lessons</h2>
        <div className="mt-6 grid gap-4">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card card-pad flex gap-4">
              <span className="icon-tile bg-blue-50 text-blue-600"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-500">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-14 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">What you can study</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {COURSES.map(({ icon: Icon, tone, check, title, items }) => (
            <div key={title} className="card card-pad">
              <span className={`icon-tile ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-4 font-display text-xl font-bold text-ink-900">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[15px] text-ink-700">
                    <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${check}`} aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
          <h2 className="h-section">About band scores</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
            The band scores you see are estimates to guide your practice. Official IELTS results are only issued by the official test partners after a real test.
          </p>
        </div>

        <div className="mt-14 card p-6 text-center sm:p-10">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900">See it for yourself</h2>
          <p className="lead mx-auto mt-2 max-w-md">Open the demo — no sign-up — or tell us what you need.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/demo" className="btn-primary btn-lg">Try the live demo <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
            <Link href="/contact" className="btn-secondary btn-lg">Contact us</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
