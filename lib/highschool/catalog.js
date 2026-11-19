// lib/highschool/catalog.js
//
// SERVER-ONLY. Reads the lesson JSON files in content/highschool at build /
// request time and exposes the course tree:
//   subject -> topics -> lessons
// Pages that use this are statically generated, so the files are read once
// at build time.
import fs from 'node:fs'
import path from 'node:path'
import { SUBJECTS, subjectMeta } from '@/lib/highschool/subjects'

const ROOT = path.join(process.cwd(), 'content', 'highschool')

let cache = null

function readAll() {
  if (cache && process.env.NODE_ENV === 'production') return cache
  const lessons = []
  for (const subject of SUBJECTS) {
    const dir = path.join(ROOT, subject.slug)
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
      try {
        const lesson = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
        lessons.push({ ...lesson, slug: file.replace(/\.json$/, '') })
      } catch {
        // A half-written or invalid file must never take the site down.
      }
    }
  }
  lessons.sort((a, b) =>
    a.subject.localeCompare(b.subject) || a.topicSlug.localeCompare(b.topicSlug) || a.order - b.order
  )
  cache = lessons
  return lessons
}

export function getAllLessons() {
  return readAll()
}

// Light version for lists (no sections / quiz bodies).
export function toSummary(l) {
  return {
    id: l.id, slug: l.slug, subject: l.subject, topic: l.topic, topicSlug: l.topicSlug,
    form: l.form, term: l.term, order: l.order, title: l.title, summary: l.summary,
    minutes: l.minutes, questionCount: l.quiz?.length ?? 0,
  }
}

export function getSubjects() {
  const all = readAll()
  return SUBJECTS.map((meta) => {
    const lessons = all.filter((l) => l.subject === meta.slug)
    return {
      ...meta,
      lessonCount: lessons.length,
      minutes: lessons.reduce((n, l) => n + (l.minutes || 0), 0),
      forms: [...new Set(lessons.map((l) => l.form))].sort(),
      lessonIds: lessons.map((l) => l.id),
    }
  }).filter((s) => s.lessonCount > 0)
}

export function getSubject(slug) {
  const meta = subjectMeta(slug)
  if (!meta) return null
  const lessons = readAll().filter((l) => l.subject === slug)
  if (lessons.length === 0) return null
  const topics = []
  for (const l of lessons) {
    let t = topics.find((x) => x.topicSlug === l.topicSlug)
    if (!t) {
      t = { topic: l.topic, topicSlug: l.topicSlug, form: l.form, term: l.term, lessons: [] }
      topics.push(t)
    }
    t.lessons.push(toSummary(l))
  }
  return { ...meta, topics, lessonCount: lessons.length }
}

export function getLesson(subjectSlug, lessonSlug) {
  const lessons = readAll().filter((l) => l.subject === subjectSlug)
  const index = lessons.findIndex((l) => l.slug === lessonSlug)
  if (index === -1) return null
  const next = lessons[index + 1]
  const prev = lessons[index - 1]
  return {
    lesson: lessons[index],
    next: next ? toSummary(next) : null,
    prev: prev ? toSummary(prev) : null,
    position: index + 1,
    total: lessons.length,
  }
}
