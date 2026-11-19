// app/api/hs/lessons/route.js
//
// GET /api/hs/lessons                      -> every high-school lesson
// GET /api/hs/lessons?subject=mathematics  -> one subject
// GET /api/hs/lessons?subject=mathematics&topic=fractions -> one topic
//
// Full lesson objects (including `slug`), used by "Save topic offline" to put
// several lessons on the device in one request. Lesson content is public.
import { NextResponse } from 'next/server'
import { getAllLessons } from '@/lib/highschool/catalog'

export const dynamic = 'force-dynamic'

export function GET(request) {
  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject')
  const topic = searchParams.get('topic')

  let lessons = getAllLessons()
  if (subject) lessons = lessons.filter((l) => l.subject === subject)
  if (topic) lessons = lessons.filter((l) => l.topicSlug === topic)

  return NextResponse.json({ lessons }, { headers: { 'Cache-Control': 'no-store' } })
}
