import { Atom, BookOpen, Calculator, Dna, FlaskConical, PenLine } from 'lucide-react'

const ICONS = { calculator: Calculator, dna: Dna, flask: FlaskConical, atom: Atom, pen: PenLine }

export default function SubjectIcon({ name, className = 'h-5 w-5' }) {
  const Icon = ICONS[name] || BookOpen
  return <Icon className={className} aria-hidden="true" />
}
