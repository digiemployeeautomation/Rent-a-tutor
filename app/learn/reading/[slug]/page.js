// app/learn/reading/[slug]/page.js
//
// Renders a single Reading strategy lesson (skill_lessons row) via SlideViewer,
// then a CTA to the linked drill (the "Test"). Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import SlideViewer from '@/components/lesson/SlideViewer'

export default async function ReadingLessonPage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/learn/reading/${params.slug}`)

  const { data: lesson } = await supabase
    .from('skill_lessons')
    .select('slug, title, summary, slides_data, drill_item_id, status')
    .eq('slug', params.slug)
    .single()

  if (!lesson || lesson.status !== 'published') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-800">Lesson not found</h1>
        <p className="mt-2 text-gray-500">This lesson does not exist or is not available yet.</p>
        <Link href="/learn/reading" className="mt-4 inline-block text-sm text-blue-600">← Back to Reading path</Link>
      </main>
    )
  }

  const blocks = lesson.slides_data?.blocks ?? []

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/learn/reading" className="text-xs text-gray-400 hover:text-gray-600">← Reading path</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-800">{lesson.title}</h1>
      {lesson.summary ? <p className="mt-2 text-gray-500">{lesson.summary}</p> : null}

      <div className="mt-8">
        <SlideViewer slidesData={blocks} />
      </div>

      <div className="mt-8 flex justify-end">
        {lesson.drill_item_id ? (
          <Link
            href={`/practice/reading/${lesson.drill_item_id}`}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Now try it →
          </Link>
        ) : (
          <span className="text-sm text-gray-400">Practice for this lesson is coming soon.</span>
        )}
      </div>
    </main>
  )
}
