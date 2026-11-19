// components/dashboard/ielts-ui.js — icons and links for the four IELTS sections.
import { BookOpen, Headphones, Mic, PenLine } from 'lucide-react'

export const IELTS_SECTIONS = [
  { key: 'listening', type: 'listening_set', label: 'Listening', icon: Headphones },
  { key: 'reading', type: 'reading_set', label: 'Reading', icon: BookOpen },
  { key: 'writing', type: 'writing_task', label: 'Writing', icon: PenLine },
  { key: 'speaking', type: 'speaking_task', label: 'Speaking', icon: Mic },
]

const BY_TYPE = Object.fromEntries(IELTS_SECTIONS.map((s) => [s.type, s]))
const BY_KEY = Object.fromEntries(IELTS_SECTIONS.map((s) => [s.key, s]))

export function ieltsSectionForType(type) {
  return BY_TYPE[type] ?? null
}

export function ieltsSectionLabel(key) {
  return BY_KEY[key]?.label ?? null
}

export function IeltsSectionIcon({ type, className = 'h-5 w-5' }) {
  const Icon = BY_TYPE[type]?.icon ?? BookOpen
  return <Icon className={className} aria-hidden="true" />
}
