// components/ielts/option-labels.js
//
// Build { [questionId]: { [value]: label } } from practice_questions rows
// (client-readable `options.choices`), so results can show "B. forage over a
// longer season." instead of a bare letter.
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
