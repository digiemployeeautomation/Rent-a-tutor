import { describe, it, expect } from 'vitest'
import { validateSpeakingGrade, SPEAKING_CRITERIA } from '../speaking-gateway.js'

function validGrade() {
  return {
    band_overall: 6.5,
    band_per_criterion: { fluency: 6.0, lexical: 6.5, grammar: 6.5, pronunciation: 7.0 },
    feedback: { fluency: 'a', lexical: 'b', grammar: 'c', pronunciation: 'd' },
  }
}

describe('validateSpeakingGrade', () => {
  it('accepts a well-formed grade and returns it unchanged', () => {
    const g = validGrade()
    expect(validateSpeakingGrade(g)).toBe(g)
  })

  it('accepts boundary bands 0 and 9', () => {
    const g = validGrade()
    g.band_overall = 0
    g.band_per_criterion = { fluency: 0, lexical: 9, grammar: 0, pronunciation: 9 }
    expect(() => validateSpeakingGrade(g)).not.toThrow()
  })

  it('rejects a non-object', () => {
    expect(() => validateSpeakingGrade(null)).toThrow()
    expect(() => validateSpeakingGrade([1, 2])).toThrow()
    expect(() => validateSpeakingGrade('6.5')).toThrow()
  })

  it('rejects a missing or non-numeric band_overall', () => {
    const g = validGrade()
    delete g.band_overall
    expect(() => validateSpeakingGrade(g)).toThrow(/band_overall/)
    expect(() => validateSpeakingGrade({ ...validGrade(), band_overall: '6.5' })).toThrow(/band_overall/)
    expect(() => validateSpeakingGrade({ ...validGrade(), band_overall: NaN })).toThrow(/band_overall/)
  })

  it('rejects an out-of-range band', () => {
    expect(() => validateSpeakingGrade({ ...validGrade(), band_overall: 9.5 })).toThrow()
    expect(() => validateSpeakingGrade({ ...validGrade(), band_overall: -1 })).toThrow()
  })

  it('rejects when any criterion is missing or non-numeric', () => {
    for (const c of SPEAKING_CRITERIA) {
      const g = validGrade()
      delete g.band_per_criterion[c]
      expect(() => validateSpeakingGrade(g)).toThrow(new RegExp(c))
    }
    const stringy = validGrade()
    stringy.band_per_criterion.grammar = 'good'
    expect(() => validateSpeakingGrade(stringy)).toThrow(/grammar/)
  })

  it('rejects a missing feedback object', () => {
    const g = validGrade()
    delete g.feedback
    expect(() => validateSpeakingGrade(g)).toThrow(/feedback/)
  })
})
