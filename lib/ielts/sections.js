// lib/ielts/sections.js
//
// Section descriptor registry. The practice index, dashboard, and (later)
// mock assembler enumerate sections from here instead of hardcoding the four
// types. A section becomes playable by flipping `ready: true` when its route
// ships — that is the only shared-file edit a Wave 2 section makes.

export const SECTIONS = [
  {
    type: 'reading_set',
    label: 'Reading',
    routeBase: '/practice/reading',
    gradedBy: 'deterministic',
    ready: true, // Wave 2
  },
  {
    type: 'listening_set',
    label: 'Listening',
    routeBase: '/practice/listening',
    gradedBy: 'deterministic',
    ready: true, // Wave 2
  },
  {
    type: 'writing_task',
    label: 'Writing',
    routeBase: '/practice/writing',
    gradedBy: 'auto-llm',
    ready: true,
  },
  {
    type: 'speaking_task',
    label: 'Speaking',
    routeBase: '/practice/speaking',
    gradedBy: 'auto-stt-llm',
    ready: true, // Wave 2
  },
]

const BY_TYPE = Object.fromEntries(SECTIONS.map((s) => [s.type, s]))

export const SUB_SKILL_LABELS = {
  listening: 'Listening',
  reading: 'Reading',
  'writing-task-1-academic': 'Task 1 (Academic)',
  'writing-task-1-general': 'Task 1 (General)',
  'writing-task-2': 'Task 2',
  'speaking-part-1': 'Speaking Part 1',
  'speaking-part-2': 'Speaking Part 2',
  'speaking-part-3': 'Speaking Part 3',
}

export function sectionForType(type) {
  return BY_TYPE[type] ?? null
}

export function labelForType(type) {
  return BY_TYPE[type]?.label ?? type
}

export function subSkillLabel(subSkill) {
  return SUB_SKILL_LABELS[subSkill] ?? subSkill
}

// Link to a practice item, or null if the section's UI is not built yet
// (rendered as "Coming soon").
export function hrefForItem(item) {
  const section = BY_TYPE[item.type]
  if (!section || !section.ready) return null
  return `${section.routeBase}/${item.id}`
}
