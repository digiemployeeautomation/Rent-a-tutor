// app/learn/high-school/page.js — High-school course hub (public, static).
import { getSubjects } from '@/lib/highschool/catalog'
import SubjectGrid from '@/components/highschool/SubjectGrid'

export const metadata = { title: 'High School courses' }

const HOW = [
  { title: 'Learn in short steps', text: 'Every lesson explains one idea at a time, with worked examples from everyday life in Zambia.' },
  { title: 'Check as you go', text: 'Quick questions with instant explanations, then an 8-question quiz to finish each lesson.' },
  { title: 'Study without data', text: 'Save any lesson to your phone and open it later with no internet connection.' },
]

export default function HighSchoolHubPage() {
  const subjects = getSubjects().map(({ tile, bar, slug, name, blurb, icon, lessonCount, minutes, forms, lessonIds }) => (
    { tile, bar, slug, name, blurb, icon, lessonCount, minutes, forms, lessonIds }
  ))
  const lessonCount = subjects.reduce((n, s) => n + s.lessonCount, 0)

  return (
    <div className="container-app pb-16 pt-10 sm:pt-16">
      <header className="max-w-3xl">
        <p className="eyebrow">High School · Zambian O-Level syllabus</p>
        <h1 className="h-display mt-3 text-balance">Choose a subject.</h1>
        <p className="lead mt-5">
          {lessonCount} step-by-step lessons across {subjects.length} subjects, written for Forms 1 to 4.
          Each one ends with a quiz, so you know you have understood it.
        </p>
      </header>

      <div className="mt-10 sm:mt-14"><SubjectGrid subjects={subjects} /></div>

      <section className="mt-16 sm:mt-24" aria-labelledby="how-heading">
        <h2 id="how-heading" className="h-section">How every lesson works</h2>
        <ol className="mt-6 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {HOW.map(({ title, text }, i) => (
            <li key={title} className="border-t border-ink-300 pt-4">
              <span className="numeral block text-[2.5rem] leading-none text-copper-600" aria-hidden="true">{i + 1}</span>
              <h3 className="h-sub mt-3">{title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
