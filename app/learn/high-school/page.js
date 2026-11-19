// app/learn/high-school/page.js — High-school course hub (public, static).
import { BookOpenCheck, Download, ListChecks } from 'lucide-react'
import { getSubjects } from '@/lib/highschool/catalog'
import SubjectGrid from '@/components/highschool/SubjectGrid'

export const metadata = { title: 'High School courses' }

const HOW = [
  { icon: BookOpenCheck, title: 'Learn in short steps', text: 'Every lesson explains one idea at a time, with worked examples from everyday life in Zambia.' },
  { icon: ListChecks, title: 'Check as you go', text: 'Quick questions with instant explanations, then an 8-question quiz to finish each lesson.' },
  { icon: Download, title: 'Study without data', text: 'Save any lesson to your phone and open it later with no internet connection.' },
]

export default function HighSchoolHubPage() {
  const subjects = getSubjects().map(({ tile, bar, slug, name, blurb, icon, lessonCount, minutes, forms, lessonIds }) => (
    { tile, bar, slug, name, blurb, icon, lessonCount, minutes, forms, lessonIds }
  ))
  const lessonCount = subjects.reduce((n, s) => n + s.lessonCount, 0)

  return (
    <div className="container-app py-8 sm:py-12">
      <p className="eyebrow">High School · Zambian O-Level syllabus</p>
      <h1 className="h-display mt-3 max-w-3xl">Choose a subject and start learning</h1>
      <p className="lead mt-4 max-w-2xl">
        {lessonCount} step-by-step lessons across {subjects.length} subjects, written for Forms 1 to 4.
        Each one ends with a quiz so you know you have understood it.
      </p>

      <div className="mt-8"><SubjectGrid subjects={subjects} /></div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {HOW.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-ink-100 bg-white/60 p-5">
            <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <p className="mt-3 text-[15px] font-semibold text-ink-900">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
