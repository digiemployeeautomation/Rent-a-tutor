import { describe, it, expect } from 'vitest'
import { computeRemaining, formatClock, proportionalLimit } from '../exam-timer.js'

describe('computeRemaining', () => {
  it('is the full limit at start', () => {
    expect(computeRemaining(1000, 60, 1000)).toBe(60)
  })
  it('decreases by elapsed whole seconds', () => {
    expect(computeRemaining(1000, 60, 11000)).toBe(50)
  })
  it('never goes negative', () => {
    expect(computeRemaining(1000, 60, 100000)).toBe(0)
  })
})

describe('formatClock', () => {
  it('formats mm:ss with zero padding', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(9)).toBe('00:09')
    expect(formatClock(540)).toBe('09:00')
  })
  it('supports over an hour', () => {
    expect(formatClock(3661)).toBe('61:01')
  })
  it('clamps negatives to 00:00', () => {
    expect(formatClock(-5)).toBe('00:00')
  })
})

describe('proportionalLimit', () => {
  it('is ~1.5 min per question by default', () => {
    expect(proportionalLimit(6)).toBe(540)
    expect(proportionalLimit(40)).toBe(3600)
  })
  it('is zero for no questions', () => {
    expect(proportionalLimit(0)).toBe(0)
  })
})
