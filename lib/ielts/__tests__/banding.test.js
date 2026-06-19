import { describe, it, expect } from 'vitest'
import { estimateReadingBand } from '../banding.js'

describe('estimateReadingBand — academic (40-question)', () => {
  it('maps top of each band boundary', () => {
    expect(estimateReadingBand(40, 40)).toBe(9.0)
    expect(estimateReadingBand(39, 40)).toBe(9.0)
    expect(estimateReadingBand(38, 40)).toBe(8.5)
    expect(estimateReadingBand(37, 40)).toBe(8.5)
    expect(estimateReadingBand(36, 40)).toBe(8.0)
    expect(estimateReadingBand(30, 40)).toBe(7.0)
    expect(estimateReadingBand(29, 40)).toBe(6.5)
    expect(estimateReadingBand(23, 40)).toBe(6.0)
    expect(estimateReadingBand(13, 40)).toBe(4.5)
  })
  it('floors to 2.0 at zero', () => {
    expect(estimateReadingBand(0, 40)).toBe(2.0)
  })
})

describe('estimateReadingBand — scaling for short sets', () => {
  it('scales a 6-question set to a /40 equivalent', () => {
    expect(estimateReadingBand(6, 6)).toBe(9.0)   // 40/40
    expect(estimateReadingBand(5, 6)).toBe(7.5)   // round(33.3)=33 -> 7.5
    expect(estimateReadingBand(3, 6)).toBe(5.5)   // 20 -> 5.5
    expect(estimateReadingBand(0, 6)).toBe(2.0)
  })
})

describe('estimateReadingBand — general training', () => {
  it('needs more correct per band than academic', () => {
    expect(estimateReadingBand(40, 40, 'general')).toBe(9.0)
    expect(estimateReadingBand(39, 40, 'general')).toBe(8.5)
    expect(estimateReadingBand(5, 6, 'general')).toBe(6.5) // 33 -> 6.5 (vs 7.5 academic)
  })
})

describe('estimateReadingBand — edges', () => {
  it('returns null when there are no questions', () => {
    expect(estimateReadingBand(0, 0)).toBeNull()
    expect(estimateReadingBand(3, 0)).toBeNull()
  })
  it('clamps a raw score above total', () => {
    expect(estimateReadingBand(99, 40)).toBe(9.0)
  })
  it('treats an unknown variant as academic', () => {
    expect(estimateReadingBand(38, 40, 'nonsense')).toBe(8.5)
  })
})
