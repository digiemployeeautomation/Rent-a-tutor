import { describe, it, expect } from 'vitest'
import { rawToBand, roundIeltsBand, overallBand } from '../band-conversion.js'

describe('rawToBand — Listening', () => {
  it('maps top and bottom of the scale', () => {
    expect(rawToBand(40, { section: 'listening' })).toBe(9.0)
    expect(rawToBand(0, { section: 'listening' })).toBe(0.0)
  })
  it('maps mid-range thresholds', () => {
    expect(rawToBand(30, { section: 'listening' })).toBe(7.0)
    expect(rawToBand(23, { section: 'listening' })).toBe(6.0)
    expect(rawToBand(16, { section: 'listening' })).toBe(5.0)
  })
  it('clamps out-of-range raw scores', () => {
    expect(rawToBand(99, { section: 'listening' })).toBe(9.0)
    expect(rawToBand(-5, { section: 'listening' })).toBe(0.0)
  })
})

describe('rawToBand — Reading variants differ', () => {
  it('General Training needs more correct answers than Academic for the same band', () => {
    // 30 correct: Academic = 7.0, General = 6.0
    expect(rawToBand(30, { section: 'reading', variant: 'academic' })).toBe(7.0)
    expect(rawToBand(30, { section: 'reading', variant: 'general' })).toBe(6.0)
  })
  it('defaults to academic when variant omitted', () => {
    expect(rawToBand(30, { section: 'reading' })).toBe(7.0)
  })
})

describe('roundIeltsBand', () => {
  it('rounds to the nearest half band, .25 up', () => {
    expect(roundIeltsBand(6.125)).toBe(6.0)
    expect(roundIeltsBand(6.25)).toBe(6.5)
    expect(roundIeltsBand(6.75)).toBe(7.0)
    expect(roundIeltsBand(6.5)).toBe(6.5)
  })
})

describe('overallBand', () => {
  it('averages four sections and rounds per IELTS rule', () => {
    expect(overallBand({ l: 6.5, r: 6.5, w: 6.0, s: 6.0 })).toBe(6.5) // avg 6.25 → 6.5
    expect(overallBand({ l: 7.0, r: 6.5, w: 6.0, s: 6.0 })).toBe(6.5) // avg 6.375 → 6.5
    expect(overallBand({ l: 5.0, r: 5.0, w: 5.0, s: 5.0 })).toBe(5.0)
  })
  it('returns null with no numeric bands', () => {
    expect(overallBand({})).toBe(null)
  })
})
