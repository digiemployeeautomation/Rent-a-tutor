// app/learn/high-school/[subject]/[lesson]/page.js — the lesson itself.
import { notFound } from 'next/navigation'
import { getAllLessons, getLesson } from '@/lib/highschool/catalog'
import { subjectMeta } from '@/lib/highschool/subjects'
import LessonScreen from '@/components/highschool/LessonScreen'

export function generateStaticParams() {
  return getAllLessons().map((l) => ({ subject: l.subject, lesson: l.slug }))
}

export function generateMetadata({ params }) {
  const found = getLesson(params.subject, params.lesson)
  return { title: found ? found.lesson.title : 'Lesson', description: found?.lesson.summary }
}

export default function LessonPage({ params }) {
  const found = getLesson(params.subject, params.lesson)
  if (!found) notFound()
  const { lesson, next } = found
  const meta = subjectMeta(lesson.subject)

  return (
    <LessonScreen
      lesson={lesson}
      meta={meta}
      backHref={`/learn/high-school/${lesson.subject}`}
      next={next ? { href: `/learn/high-school/${next.subject}/${next.slug}`, title: next.title } : null}
    />
  )
}
