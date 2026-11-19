// app/about/page.js
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import SiteFooter from '@/components/marketing/SiteFooter'
import SubjectArt from '@/components/art/SubjectArt'
import { getSubjects } from '@/lib/highschool/catalog'

export const metadata = {
  title: 'About',
}

const PRINCIPLES = [
  { title: 'Plain, clear English', body: 'Short sentences and everyday examples, written for students who learn in English as a second language.' },
  { title: 'Phone first', body: 'Every screen is designed for a small phone first, with big buttons and one idea at a time.' },
  { title: 'Light on data', body: 'Lessons can be saved to the phone and opened later with no internet connection.' },
]

const COURSES = [
  {
    title: 'High School',
    art: 'mathematics',
    tone: 'board',
    rule: 'border-board-700',
    check: 'text-board-600',
    items: [
      'Zambian O-Level syllabus, Forms 1 to 4',
      'Mathematics, Biology, Chemistry, Physics and English Language',
      'Step-by-step lessons, worked examples and quick checks',
      'An 8-question quiz at the end of every lesson',
    ],
  },
  {
    title: 'IELTS preparation',
    art: 'reading',
    tone: 'copper',
    rule: 'border-copper-600',
    check: 'text-copper-600',
    items: [
      'Listening, Reading, Writing and Speaking practice',
      'Instant band-score feedback on your answers',
      'Reading strategy lessons and drills for every question type',
      'A timed reading mock exam with an estimated band',
    ],
  },
]

// One ruled section: its heading in the left margin, its content at the right.
function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="grid gap-x-14 gap-y-5 border-t-2 border-ink-900 pt-5 sm:pt-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
      <h2 id={id} className="h-section">{title}</h2>
      <div>{children}</div>
    </section>
  )
}

export default function AboutPage() {
  const subjects = getSubjects()
  const lessonCount = subjects.reduce((n, s) => n + s.lessonCount, 0)

  return (
    <div>
      <div className="container-app pt-10 sm:pt-16">
        <header className="max-w-3xl">
          <p className="eyebrow">About Rent a Tutor</p>
          <h1 className="h-display mt-3 text-balance">Good teaching, one <mark className="hl">clear step</mark> at a time.</h1>
          <p className="lead mt-6">
            Rent a Tutor is an online tutoring platform for Zambian secondary-school students and IELTS candidates. We turn each topic into short steps, check understanding as you go, and explain every answer. It is completely free.
          </p>
        </header>

        <div className="mt-14 space-y-14 sm:mt-20 sm:space-y-20">
          <Section id="about-build" title="How we build lessons">
            <dl className="-mt-1 divide-y divide-ink-200 lg:-mt-5">
              {PRINCIPLES.map(({ title, body }) => (
                <div key={title} className="grid gap-x-8 gap-y-1 py-4 sm:grid-cols-[200px_1fr] sm:py-5">
                  <dt className="text-[17px] font-bold leading-snug text-ink-900">{title}</dt>
                  <dd className="max-w-[52ch] text-base leading-relaxed text-ink-600">{body}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="about-study" title="What you can study">
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {COURSES.map(({ title, art, tone, rule, check, items }) => (
                <div key={title}>
                  <div className={`flex items-end justify-between gap-4 border-b-2 pb-3 ${rule}`}>
                    <h3 className="font-display text-[1.375rem] font-semibold leading-tight text-ink-900" style={{ letterSpacing: '-0.02em' }}>{title}</h3>
                    <SubjectArt name={art} tone={tone} className="h-12 w-12" />
                  </div>
                  <ul className="mt-4 space-y-3">
                    {items.map((item) => (
                      <li key={item} className="flex gap-3 text-base leading-snug text-ink-700">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${check}`} strokeWidth={3} aria-hidden="true" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-[62ch] text-[15px] leading-relaxed text-ink-600">
              This demo holds {lessonCount} sample High School lessons across {subjects.length} subjects. It is not the full curriculum yet.
            </p>
          </Section>

          <Section id="about-bands" title="About band scores">
            <p className="max-w-[58ch] text-[17px] leading-[1.6] text-ink-700">
              The band scores you see are estimates to guide your practice. Official IELTS results are only issued by the official test partners after a real test. In this demo, Writing and Speaking marking may show sample feedback.
            </p>
          </Section>

          <section aria-labelledby="about-cta" className="flex flex-col gap-7 border-t-2 border-ink-900 pt-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 id="about-cta" className="h-page">See it for yourself.</h2>
              <p className="lead mt-2">Open the demo with no sign-up, or tell us what you need.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/demo" className="btn-primary btn-lg group">Try the demo <ArrowRight className="nudge h-5 w-5" aria-hidden="true" /></Link>
              <Link href="/contact" className="btn-secondary btn-lg">Contact us</Link>
            </div>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
