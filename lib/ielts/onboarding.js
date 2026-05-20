// lib/ielts/onboarding.js
//
// Pure helpers for the IELTS onboarding questionnaire. Validation and
// track inference live here so they can be unit-tested in isolation and
// reused by both the client wizard and the server-side persistence
// endpoint.

export const VARIANTS = ['academic', 'general']

export const SECTIONS = ['listening', 'reading', 'writing', 'speaking']

export const SUB_SKILLS = [
  'listening',
  'reading',
  'writing-task-1-academic',
  'writing-task-1-general',
  'writing-task-2',
  'speaking-part-1',
  'speaking-part-2',
  'speaking-part-3',
]

export const TRACKS = ['foundation', 'practice', 'mock']

export function isValidProfile(answers) {
  if (!answers || typeof answers !== 'object') return false
  if (!VARIANTS.includes(answers.variant)) return false
  if (typeof answers.target_band !== 'number') return false
  if (answers.target_band < 4 || answers.target_band > 9) return false
  if (typeof answers.hours_per_week !== 'number' || answers.hours_per_week < 1) return false
  if (answers.weakest_section != null && !SECTIONS.includes(answers.weakest_section)) return false
  if (answers.current_band_self != null) {
    if (typeof answers.current_band_self !== 'number') return false
    if (answers.current_band_self < 0 || answers.current_band_self > 9) return false
  }
  return true
}

export function inferTrackFromBand(band) {
  if (band == null) return 'practice'
  if (band <= 5.5) return 'foundation'
  if (band >= 7.0) return 'mock'
  return 'practice'
}

// Given the questionnaire answers, return the initial set of user_tracks rows
// to seed for the user. Variant determines which Writing Task 1 sub-skill is
// active; the other Task 1 variant is omitted (the student can revisit it
// later if they switch variants).
export function initialUserTracks(answers) {
  const baseTrack = inferTrackFromBand(answers.current_band_self)
  const task1SubSkill = answers.variant === 'general'
    ? 'writing-task-1-general'
    : 'writing-task-1-academic'

  const activeSubSkills = [
    'listening',
    'reading',
    task1SubSkill,
    'writing-task-2',
    'speaking-part-1',
    'speaking-part-2',
    'speaking-part-3',
  ]

  return activeSubSkills.map((sub_skill) => ({
    sub_skill,
    track: baseTrack,
    inferred_from: answers.current_band_self != null ? 'self_declared' : 'default',
  }))
}
