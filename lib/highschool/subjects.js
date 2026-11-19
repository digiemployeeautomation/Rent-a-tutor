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
    tile: 'bg-blue-50 text-blue-700',
    bar: 'bg-blue-600',
    ring: 'text-blue-600',
    wash: 'from-blue-50',
  },
  {
    slug: 'biology',
    name: 'Biology',
    blurb: 'How living things work — from single cells to the human body.',
    icon: 'dna',
    tile: 'bg-emerald-50 text-emerald-700',
    bar: 'bg-emerald-600',
    ring: 'text-emerald-600',
    wash: 'from-emerald-50',
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    blurb: 'Matter, particles and reactions explained with everyday examples.',
    icon: 'flask',
    tile: 'bg-violet-50 text-violet-700',
    bar: 'bg-violet-600',
    ring: 'text-violet-600',
    wash: 'from-violet-50',
  },
  {
    slug: 'physics',
    name: 'Physics',
    blurb: 'Measurement, forces and energy — the rules behind how things move.',
    icon: 'atom',
    tile: 'bg-sun-100 text-sun-600',
    bar: 'bg-sun-500',
    ring: 'text-sun-500',
    wash: 'from-sun-50',
  },
  {
    slug: 'english-language',
    name: 'English Language',
    blurb: 'Write clear paragraphs, summaries and letters that earn marks.',
    icon: 'pen',
    tile: 'bg-rose-50 text-rose-700',
    bar: 'bg-rose-600',
    ring: 'text-rose-600',
    wash: 'from-rose-50',
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
