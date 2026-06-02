import { describe, it, expect } from 'vitest'
import { stubGradeSpeaking } from '../stub-speaking-grader.js'

const CRITERIA = ['fluency', 'lexical', 'grammar', 'pronunciation']

describe('stubGradeSpeaking', () => {
  it('returns all-zeros for an empty transcript', () => {
    const grade = stubGradeSpeaking({ part: 'speaking-part-1', taskPrompt: 'p', transcript: '' })
    expect(grade.band_overall).toBe(0.0)
    for (const c of CRITERIA) {
      expect(grade.band_per_criterion[c]).toBe(0.0)
      expect(typeof grade.feedback[c]).toBe('string')
    }
  })

  it('returns the four speaking criteria keys (not writing keys)', () => {
    const grade = stubGradeSpeaking({
      part: 'speaking-part-2', taskPrompt: 'p',
      transcript: Array(80).fill('word').join(' '),
    })
    expect(Object.keys(grade.band_per_criterion).sort()).toEqual([...CRITERIA].sort())
    expect(Object.keys(grade.feedback).sort()).toEqual([...CRITERIA].sort())
  })

  it('returns the minimum band for very short transcripts', () => {
    const grade = stubGradeSpeaking({
      part: 'speaking-part-1', taskPrompt: 'p',
      transcript: 'I live in a small town.',
    })
    expect(grade.band_overall).toBe(4.0)
  })

  it('returns a higher band for longer transcripts (monotonic)', () => {
    const short = stubGradeSpeaking({
      part: 'speaking-part-1', taskPrompt: 'p',
      transcript: Array(40).fill('word').join(' '),
    })
    const long = stubGradeSpeaking({
      part: 'speaking-part-1', taskPrompt: 'p',
      transcript: Array(180).fill('word').join(' '),
    })
    expect(long.band_overall).toBeGreaterThan(short.band_overall)
  })

  it('caps at the maximum band for very long transcripts', () => {
    const huge = stubGradeSpeaking({
      part: 'speaking-part-3', taskPrompt: 'p',
      transcript: Array(1000).fill('word').join(' '),
    })
    expect(huge.band_overall).toBe(7.5)
  })

  it('produces band-per-criterion values within 0.5 of the overall', () => {
    const grade = stubGradeSpeaking({
      part: 'speaking-part-2', taskPrompt: 'p',
      transcript: Array(120).fill('word').join(' '),
    })
    for (const v of Object.values(grade.band_per_criterion)) {
      expect(Math.abs(v - grade.band_overall)).toBeLessThanOrEqual(0.5)
    }
  })

  it('produces bands on 0.5 increments', () => {
    const grade = stubGradeSpeaking({
      part: 'speaking-part-1', taskPrompt: 'p',
      transcript: Array(95).fill('word').join(' '),
    })
    const all = [grade.band_overall, ...Object.values(grade.band_per_criterion)]
    for (const b of all) {
      expect(Math.round(b * 2)).toBe(b * 2)
    }
  })

  it('is deterministic for the same input', () => {
    const args = { part: 'speaking-part-1', taskPrompt: 'p', transcript: 'a b c d e f g h i j k l' }
    expect(stubGradeSpeaking(args)).toEqual(stubGradeSpeaking(args))
  })
})
