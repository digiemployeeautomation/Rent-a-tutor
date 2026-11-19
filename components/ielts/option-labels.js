// components/ielts/option-labels.js
//
// Helpers for answer options (client-readable `options.choices`).

// Build { [questionId]: { [value]: label } } from practice_questions rows, so
// results can show "B. forage over a longer season." instead of a bare letter.
export function optionLabelsFor(questions) {
  const out = {}
  for (const q of questions ?? []) {
    const choices = q.options?.choices
    if (!Array.isArray(choices)) continue
    const map = {}
    for (const c of choices) {
      if (c && typeof c === 'object' && c.value != null) map[c.value] = c.label ?? String(c.value)
    }
    out[q.id] = map
  }
  return out
}

// Split an option into the letter for the exam-paper ring and the text beside
// it. Labels usually carry their own marker ("B. forage over a longer season.",
// "ii. The dangers of traffic"), so that marker is lifted out instead of being
// shown twice. Options without one are lettered A, B, C by position.
//   splitOption({ value: 'B', label: 'B. forage…' }, 1) -> { letter: 'B', text: 'forage…' }
//   splitOption({ value: 'x', label: 'Dr Okafor' }, 2)  -> { letter: 'C', text: 'Dr Okafor' }
export function splitOption(option, index = 0) {
  const value = String(option?.value ?? '')
  const label = String(option?.label ?? value)
  const fallback = String.fromCharCode(65 + (index % 26))
  if (value && value.length <= 4 && label.toLowerCase().startsWith(value.toLowerCase())) {
    const rest = label.slice(value.length)
    if (rest === '') return { letter: value, text: '' }
    const marker = rest.match(/^[.):]\s+/)
    if (marker) return { letter: value, text: rest.slice(marker[0].length) }
  }
  return { letter: fallback, text: label }
}
