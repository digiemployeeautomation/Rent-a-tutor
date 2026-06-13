// lib/ielts/reading-modules.js
//
// Pure helpers for the Reading "teach-then-test" path. The modules themselves
// are loaded from the skill_lessons table at request time (ordered by
// position) and passed into these helpers; this module holds only fixed config
// and logic so it can be unit-tested without I/O.

// The capstone exam is the existing mixed Academic reading demo set.
export const READING_EXAM_ITEM_ID = '11111111-1111-4111-8111-111111111111'

function byPosition(modules) {
  return [...modules].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

// The module a given practice item is the drill for, or null.
export function moduleForDrill(modules, drillItemId) {
  if (!drillItemId) return null
  return modules.find((m) => m.drill_item_id === drillItemId) ?? null
}

// The next drillable module after the one whose drill matches, or null when
// the current drill is unknown or no later module has a drill of its own.
// Trailing lesson-only modules (drill_item_id null) are skipped: the path
// advances test-to-test, and once the last drill is done the exam is the next
// step, not a drill-less lesson.
export function nextModule(modules, currentDrillItemId) {
  const sorted = byPosition(modules)
  const idx = sorted.findIndex((m) => m.drill_item_id === currentDrillItemId)
  if (idx === -1) return null
  for (let i = idx + 1; i < sorted.length; i++) {
    if (sorted[i].drill_item_id) return sorted[i]
  }
  return null
}

// True when every module that has a drill has a completed (graded) submission.
// False when there are no drillable modules (nothing to complete yet).
export function isExamUnlocked(modules, completedDrillIds) {
  const drills = modules.map((m) => m.drill_item_id).filter(Boolean)
  if (drills.length === 0) return false
  const done = new Set(completedDrillIds)
  return drills.every((id) => done.has(id))
}
