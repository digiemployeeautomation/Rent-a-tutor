// components/dashboard/ielts-ui.js — the four IELTS sections, in test order.
// `key` matches user_ielts_profile.weakest_section, the #anchor on /practice
// and the SubjectArt drawing name.

export const IELTS_SECTIONS = [
  { key: 'listening', label: 'Listening' },
  { key: 'reading', label: 'Reading' },
  { key: 'writing', label: 'Writing' },
  { key: 'speaking', label: 'Speaking' },
]

const BY_KEY = Object.fromEntries(IELTS_SECTIONS.map((s) => [s.key, s]))

export function ieltsSectionLabel(key) {
  return BY_KEY[key]?.label ?? null
}
