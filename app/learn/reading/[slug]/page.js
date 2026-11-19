// app/learn/reading/[slug]/page.js
//
// Renders a single Reading strategy lesson (skill_lessons row) via SlideViewer,
// then a CTA to the linked drill (the "Test"). Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import SlideViewer from '@/components/lesson/SlideViewer'
import LessonDownload from '@/components/offline/LessonDownload'
import { toOfflineLesson } from '@/lib/ielts/offline-lesson'

export default async function ReadingLessonPage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/learn/reading/${params.slug}`)

  const { data: lesson } = await supabase
    .from('skill_lessons')
    .select('slug, title, summary, slides_data, drill_item_id, status, position')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!lesson || lesson.status !== 'published') {
    return (
      <div className="container-read py-12 sm:py-16">
        <p className="eyebrow !text-copper-700">IELTS Reading</p>
        <h1 className="h-page mt-2">Lesson not found</h1>
        <p className="lead mt-3">This lesson does not exist or is not available yet.</p>
        <Link href="/learn/reading" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the Reading path
        </Link>
      </div>
    )
  }

  const blocks = lesson.slides_data?.blocks ?? []
  const offlineLesson = toOfflineLesson(lesson)
  const practiceHref = lesson.drill_item_id ? `/practice/reading/${lesson.drill_item_id}` : null
  const facts = [
    `About ${offlineLesson.minutes} min`,
    `${blocks.length} short slide${blocks.length === 1 ? '' : 's'}`,
    practiceHref ? 'Practice set at the end' : null,
  ].filter(Boolean)

  return (
    <div className="container-read pb-16 pt-4 sm:pt-6">
      <Link href="/learn/reading" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Reading path
      </Link>

      <header className="mt-3 sm:mt-5">
        <p className="eyebrow !text-copper-700">
          IELTS Reading{lesson.position ? ` · Lesson ${lesson.position}` : ''}
        </p>
        <h1 className="h-page mt-1.5 text-balance">{lesson.title}</h1>
        {lesson.summary ? <p className="lead mt-3">{lesson.summary}</p> : null}
        <p className="mt-3 text-[13px] font-semibold leading-5 text-ink-500 tabular">{facts.join(' · ')}</p>
      </header>

      <div className="mt-8 sm:mt-10">
        <SlideViewer slidesData={blocks} practiceHref={practiceHref} />
      </div>

      <section className="mt-12 flex flex-col gap-4 border-t-2 border-ink-900 pt-5 sm:mt-16 sm:flex-row sm:items-center sm:justify-between sm:gap-6" aria-labelledby="practice-title">
        <div>
          <h2 id="practice-title" className="h-section">Ready to try it?</h2>
          <p className="mt-1 text-[15px] leading-snug text-ink-600">
            {practiceHref
              ? 'A short practice set, marked instantly, with the reason for every answer.'
              : 'Practice for this lesson is coming soon.'}
          </p>
        </div>
        {practiceHref ? (
          <Link href={practiceHref} className="btn-secondary group w-full shrink-0 sm:w-auto">
            Practise this now <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </section>

      <div className="mt-8">
        <LessonDownload lesson={offlineLesson} />
      </div>
    </div>
  )
}
