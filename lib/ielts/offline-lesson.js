// lib/ielts/offline-lesson.js
//
// Pure mapper: a Reading strategy lesson (skill_lessons row) -> the offline
// lesson shape used by the Downloads library (same shape as the high-school
// lesson JSON, so LessonPlayer can render it offline). No I/O.

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function slideToSection(slide) {
  if (!slide || typeof slide !== 'object') return null
  const title = clean(slide.title)
  const body = clean(slide.content)
  const bullets = Array.isArray(slide.bullets)
    ? slide.bullets.map(clean).filter(Boolean)
    : []
  const answer = clean(slide.answer)
  if (!title && !body && bullets.length === 0 && !answer) return null
  return {
    type: 'explain',
    title: title || 'Key idea',
    body: answer ? [body, `Answer: ${answer}`].filter(Boolean).join('\n\n') : body,
    bullets,
  }
}

export function toOfflineLesson(row) {
  const lesson = row ?? {}
  const slug = lesson.slug ?? ''
  const blocks = Array.isArray(lesson.slides_data?.blocks)
    ? lesson.slides_data.blocks
    : Array.isArray(lesson.slides_data)
      ? lesson.slides_data
      : []
  const sections = blocks.map(slideToSection).filter(Boolean)

  return {
    id: `ielts-reading-${slug}`,
    course: 'ielts',
    subject: 'ielts-reading',
    topic: 'IELTS Reading',
    topicSlug: 'ielts-reading',
    order: lesson.position ?? 0,
    title: lesson.title ?? '',
    summary: lesson.summary ?? '',
    minutes: Math.max(5, sections.length),
    objectives: [],
    sections,
    quiz: [],
    glossary: [],
  }
}
