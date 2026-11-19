// lib/highschool/subjects.js
//
// Display metadata for high-school subjects. Pure data — safe to import from
// both server and client components. Lesson content itself lives in
// content/highschool/<slug>/*.json (see content/highschool/SCHEMA.md).

export const SUBJECTS = [
  {
    slug: 'mathematics',
    name: 'Mathematics',
    blurb: 'Numbers, fractions and problem solving, one clear step at a time.',
    icon: 'calculator',
    tile: 'bg-board-50 text-board-800',
    bar: 'bg-board-600',
    ring: 'text-board-600',
    wash: 'from-board-50',
  },
  {
    slug: 'biology',
    name: 'Biology',
    blurb: 'How living things work — from single cells to the human body.',
    icon: 'dna',
    tile: 'bg-board-50 text-board-800',
    bar: 'bg-board-600',
    ring: 'text-board-600',
    wash: 'from-board-50',
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    blurb: 'Matter, particles and reactions explained with everyday examples.',
    icon: 'flask',
    tile: 'bg-board-50 text-board-800',
    bar: 'bg-board-600',
    ring: 'text-board-600',
    wash: 'from-board-50',
  },
  {
    slug: 'physics',
    name: 'Physics',
    blurb: 'Measurement, forces and energy — the rules behind how things move.',
    icon: 'atom',
    tile: 'bg-board-50 text-board-800',
    bar: 'bg-board-600',
    ring: 'text-board-600',
    wash: 'from-board-50',
  },
  {
    slug: 'english-language',
    name: 'English Language',
    blurb: 'Write clear paragraphs, summaries and letters that earn marks.',
    icon: 'pen',
    tile: 'bg-board-50 text-board-800',
    bar: 'bg-board-600',
    ring: 'text-board-600',
    wash: 'from-board-50',
  },
]

const BY_SLUG = Object.fromEntries(SUBJECTS.map((s) => [s.slug, s]))

export function subjectMeta(slug) {
  return BY_SLUG[slug] ?? null
}

// A lesson counts as complete when the end-of-lesson quiz is passed.
export const PASS_MARK = 0.6

export function isPassed(score, total) {
  return total > 0 && score / total >= PASS_MARK
}

// URL slug for a lesson = its file name without ".json" (e.g. "1-what-is-a-fraction").
export function lessonHref(lesson) {
  return `/learn/high-school/${lesson.subject}/${lesson.slug}`
}
