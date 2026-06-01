// lib/ielts/band-conversion.js
//
// IELTS raw-score (out of 40) → band conversion for the deterministically
// graded sections (Reading + Listening), plus the overall-band rounding
// rule. These tables apply to a FULL 40-question section, so they are used
// for mock tests (Wave 4), not for single practice sets — a single set
// reports raw score + percentage only (see answer-grading.js).
//
// Tables are the widely-published IELTS conversions. They are approximate
// (the real per-test conversions vary slightly) and are surfaced to
// students as an ESTIMATED band, never a real-exam score.

// Each table: descending list of [minRaw, band]. First row whose minRaw is
// <= raw wins.
const LISTENING = [
  [39, 9.0], [37, 8.5], [35, 8.0], [32, 7.5], [30, 7.0],
  [26, 6.5], [23, 6.0], [18, 5.5], [16, 5.0], [13, 4.5],
  [10, 4.0], [6, 3.5], [4, 3.0], [3, 2.5], [2, 2.0], [1, 1.0], [0, 0.0],
]

const READING_ACADEMIC = [
  [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5], [30, 7.0],
  [27, 6.5], [23, 6.0], [19, 5.5], [15, 5.0], [13, 4.5],
  [10, 4.0], [8, 3.5], [6, 3.0], [4, 2.5], [3, 2.0], [1, 1.0], [0, 0.0],
]

const READING_GENERAL = [
  [40, 9.0], [39, 8.5], [37, 8.0], [36, 7.5], [34, 7.0],
  [32, 6.5], [30, 6.0], [27, 5.5], [23, 5.0], [19, 4.5],
  [15, 4.0], [12, 3.5], [9, 3.0], [6, 2.5], [3, 2.0], [1, 1.0], [0, 0.0],
]

function tableFor(section, variant) {
  if (section === 'listening') return LISTENING
  if (section === 'reading') {
    return variant === 'general' ? READING_GENERAL : READING_ACADEMIC
  }
  throw new Error(`No band table for section "${section}"`)
}

// Convert a raw score (0–40) to an estimated band.
export function rawToBand(rawScore, { section, variant = 'academic' } = {}) {
  const table = tableFor(section, variant)
  const raw = Math.max(0, Math.min(40, Math.round(Number(rawScore) || 0)))
  for (const [minRaw, band] of table) {
    if (raw >= minRaw) return band
  }
  return 0.0
}

// IELTS overall-band rounding: average the four section bands, then round
// to the nearest half-band, where a .25 fractional part rounds UP to .5 and
// a .75 part rounds UP to the next whole band.
//   6.125 → 6.0   6.25 → 6.5   6.75 → 7.0   6.375 → 6.5
export function roundIeltsBand(value) {
  const x = Number(value)
  if (!Number.isFinite(x)) return null
  const rounded = Math.round(x * 2) / 2
  return rounded
}

export function overallBand(sectionBands) {
  const vals = Object.values(sectionBands).filter((b) => typeof b === 'number')
  if (vals.length === 0) return null
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return roundIeltsBand(avg)
}
