// app/learn/reading/[slug]/page.js
//
// Renders a single Reading strategy lesson (skill_lessons row) via SlideViewer,
// then a CTA to the linked drill (the "Test"). Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, Layers, Target } from 'lucide-react'
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
      <div className="container-read py-12">
        <h1 className="h-page">Lesson not found</h1>
        <p className="lead mt-2">This lesson does not exist or is not available yet.</p>
        <Link href="/learn/reading" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the Reading path
        </Link>
      </div>
    )
  }

  const blocks = lesson.slides_data?.blocks ?? []
  const offlineLesson = toOfflineLesson(lesson)
  const practiceHref = lesson.drill_item_id ? `/practice/reading/${lesson.drill_item_id}` : null

  return (
    <div className="container-read py-6 sm:py-10">
      <Link href="/learn/reading" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Reading path
      </Link>

      <p className="eyebrow mt-3 !text-teal-700">
        IELTS Reading{lesson.position ? ` · Lesson ${lesson.position}` : ''}
      </p>
      <h1 className="h-page mt-2">{lesson.title}</h1>
      {lesson.summary ? <p className="lead mt-2">{lesson.summary}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chip"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> About {offlineLesson.minutes} min</span>
        <span className="chip"><Layers className="h-3.5 w-3.5" aria-hidden="true" /> {blocks.length} short slides</span>
        {practiceHref ? (
          <span className="chip-teal"><Target className="h-3.5 w-3.5" aria-hidden="true" /> Practice set at the end</span>
        ) : null}
      </div>

      <div className="mt-6">
        <SlideViewer slidesData={blocks} practiceHref={practiceHref} />
      </div>

      <div className="mt-6 card card-pad flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-ink-900">Ready to try it?</p>
          <p className="mt-0.5 text-sm text-ink-500">
            {practiceHref
              ? 'A short practice set, marked instantly, with the reason for every answer.'
              : 'Practice for this lesson is coming soon.'}
          </p>
        </div>
        {practiceHref ? (
          <Link href={practiceHref} className="btn-primary w-full sm:w-auto">
            Practise this now <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div className="mt-4">
        <LessonDownload lesson={offlineLesson} />
      </div>
    </div>
  )
}
