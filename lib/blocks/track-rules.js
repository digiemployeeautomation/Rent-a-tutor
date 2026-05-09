// lib/blocks/track-rules.js
//
// Track ↔ block-tag-sequence mapping. Each track represents a different
// pedagogical path through the same curriculum. All tracks must cover the
// same key facts; only the sequence and emphasis differ.
//
// Track names match the existing tier names in lib/tier-config.js:
//   guided     → Learner    (first-time / struggling)
//   balanced   → Reviser    (refresher pass)
//   exam_ready → Exam-prep  (mastery + past-paper style)

export const BLOCK_TAGS = [
  'foundational',
  'core-full',
  'core-summary',
  'worked-easy',
  'worked-medium',
  'worked-hard',
  'practice',
  'common-mistakes',
  'recap',
]

export const TRACKS = ['guided', 'balanced', 'exam_ready']

const RULES = {
  guided: [
    'foundational',
    'core-full',
    'worked-easy',
    'worked-medium',
    'practice',
    'recap',
  ],
  balanced: [
    'core-summary',
    'worked-medium',
    'practice',
    'recap',
  ],
  exam_ready: [
    'core-summary',
    'worked-hard',
    'common-mistakes',
    'practice',
  ],
}

export function getTrackRule(track) {
  return RULES[track] ?? RULES.balanced
}
