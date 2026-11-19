// app/learn/high-school/[subject]/page.js — one subject: topics and lessons.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSubject, getSubjects } from '@/lib/highschool/catalog'
import SubjectIcon from '@/components/highschool/SubjectIcon'
import LessonList from '@/components/highschool/LessonList'
import TopicDownload from '@/components/offline/TopicDownload'

export function generateStaticParams() {
  return getSubjects().map((s) => ({ subject: s.slug }))
}

export function generateMetadata({ params }) {
  const s = getSubject(params.subject)
  return { title: s ? s.name : 'Subject' }
}

export default function SubjectPage({ params }) {
  const subject = getSubject(params.subject)
  if (!subject) notFound()

  return (
    <div className="container-app py-6 sm:py-10">
      <Link href="/learn/high-school" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" /> All subjects
      </Link>

      <div className="mt-5 flex items-start gap-4">
        <span className={`icon-tile h-14 w-14 rounded-2xl ${subject.tile}`}><SubjectIcon name={subject.icon} className="h-7 w-7" /></span>
        <div>
          <h1 className="h-page">{subject.name}</h1>
          <p className="mt-1 text-[15px] text-ink-500">{subject.blurb}</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {subject.topics.map((t) => (
          <section key={t.topicSlug} className="card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Form {t.form} · Term {t.term}</p>
                <h2 className="h-section mt-0.5">{t.topic}</h2>
              </div>
              <TopicDownload subject={subject.slug} topicSlug={t.topicSlug} topic={t.topic} count={t.lessons.length} />
            </header>
            <LessonList lessons={t.lessons} bar={subject.bar} />
          </section>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-ink-400">
        More {subject.name} topics are added to the course as they are written and reviewed.
      </p>
    </div>
  )
}
