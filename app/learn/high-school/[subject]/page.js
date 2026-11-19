// app/learn/high-school/[subject]/page.js — one subject: topics and lessons.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSubject, getSubjects } from '@/lib/highschool/catalog'
import SubjectArt from '@/components/art/SubjectArt'
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

  const lessonCount = subject.topics.reduce((n, t) => n + t.lessons.length, 0)

  return (
    <div className="container-app pb-16 pt-6 sm:pt-10">
      <Link href="/learn/high-school" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All subjects
      </Link>

      <header className="mt-3 flex items-end justify-between gap-6 sm:mt-6">
        <div className="max-w-2xl">
          <p className="eyebrow">High School · {lessonCount} lessons</p>
          <h1 className="h-display mt-2">{subject.name}</h1>
          <p className="lead mt-4">{subject.blurb}</p>
        </div>
        <SubjectArt name={subject.slug} className="hidden h-28 w-28 sm:block lg:h-36 lg:w-36" />
      </header>

      <div className="mt-10 space-y-12 sm:mt-14">
        {subject.topics.map((t) => (
          <section key={t.topicSlug} aria-labelledby={`topic-${t.topicSlug}`}>
            <header className="rule-head flex-wrap items-end">
              <div>
                <p className="text-[13px] font-semibold text-ink-500">Form {t.form} · Term {t.term}</p>
                <h2 id={`topic-${t.topicSlug}`} className="h-section mt-0.5">{t.topic}</h2>
              </div>
              <TopicDownload subject={subject.slug} topicSlug={t.topicSlug} topic={t.topic} count={t.lessons.length} />
            </header>
            <LessonList lessons={t.lessons} />
          </section>
        ))}
      </div>

      <p className="mt-10 max-w-xl text-sm text-ink-500">
        More {subject.name} topics are added to the course as they are written and reviewed.
      </p>
    </div>
  )
}
