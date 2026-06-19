// lib/ielts/banding.js
//
// Pure IELTS Reading raw-score → band estimation. Tables map a raw score out of
// 40 to an approximate band; sets with a different question count are scaled to a
// 40-question equivalent first. Values follow commonly published conversions and
// are APPROXIMATE — calibration against examiner-scored samples is a later phase.

// Descending {min, band}: the band is the first row whose `min` (raw out of 40)
// is <= the scaled score. A floor row at min:0 guarantees a defined band.
export const BAND_TABLE_ACADEMIC = [
  { min: 39, band: 9.0 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8.0 },
  { min: 33, band: 7.5 },
  { min: 30, band: 7.0 },
  { min: 27, band: 6.5 },
  { min: 23, band: 6.0 },
  { min: 19, band: 5.5 },
  { min: 15, band: 5.0 },
  { min: 13, band: 4.5 },
  { min: 10, band: 4.0 },
  { min: 8, band: 3.5 },
  { min: 6, band: 3.0 },
  { min: 4, band: 2.5 },
  { min: 0, band: 2.0 },
]

export const BAND_TABLE_GENERAL = [
  { min: 40, band: 9.0 },
  { min: 39, band: 8.5 },
  { min: 37, band: 8.0 },
  { min: 36, band: 7.5 },
  { min: 34, band: 7.0 },
  { min: 32, band: 6.5 },
  { min: 30, band: 6.0 },
  { min: 27, band: 5.5 },
  { min: 23, band: 5.0 },
  { min: 19, band: 4.5 },
  { min: 15, band: 4.0 },
  { min: 12, band: 3.5 },
  { min: 9, band: 3.0 },
  { min: 6, band: 2.5 },
  { min: 0, band: 2.0 },
]

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

// Estimate an IELTS Reading band from a raw score. Returns null when there are
// no questions. variant: 'academic' (default) | 'general'.
export function estimateReadingBand(rawScore, total, variant = 'academic') {
  if (!total || total <= 0) return null
  const table = variant === 'general' ? BAND_TABLE_GENERAL : BAND_TABLE_ACADEMIC
  const raw = clamp(Number(rawScore) || 0, 0, total)
  const equiv40 = clamp(Math.round((raw / total) * 40), 0, 40)
  const row = table.find((r) => equiv40 >= r.min)
  return row ? row.band : null
}
