import { describe, it, expect } from 'vitest'
import { getGrader, isGradable, errorGradedBy } from '../index.js'

describe('grader registry', () => {
  it('resolves a grader for every IELTS section type', () => {
    for (const t of ['writing_task', 'reading_set', 'listening_set', 'speaking_task']) {
      expect(typeof getGrader(t)).toBe('function')
      expect(isGradable(t)).toBe(true)
    }
  })

  it('returns null / false for an unknown type', () => {
    expect(getGrader('nope')).toBe(null)
    expect(isGradable('nope')).toBe(false)
  })
})

describe('errorGradedBy', () => {
  it('stamps a failed speaking grade as auto-stt-llm, not deterministic', () => {
    expect(errorGradedBy('speaking_task', false)).toBe('auto-stt-llm')
  })

  it('stamps a failed writing grade as auto-llm', () => {
    expect(errorGradedBy('writing_task', false)).toBe('auto-llm')
  })

  it('uses stub for AI sections when running in stub mode', () => {
    expect(errorGradedBy('writing_task', true)).toBe('stub')
    expect(errorGradedBy('speaking_task', true)).toBe('stub')
  })

  it('labels deterministic sections deterministic regardless of stub flag', () => {
    expect(errorGradedBy('reading_set', false)).toBe('deterministic')
    expect(errorGradedBy('reading_set', true)).toBe('deterministic')
    expect(errorGradedBy('listening_set', false)).toBe('deterministic')
  })

  it('falls back to unknown for an unrecognised type', () => {
    expect(errorGradedBy('mystery_task', false)).toBe('unknown')
  })
})
