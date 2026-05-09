import { describe, it, expect } from 'vitest'
import { getTrackRule, BLOCK_TAGS, TRACKS } from '../track-rules.js'

describe('track-rules', () => {
  it('exposes the canonical block-tag list', () => {
    expect(BLOCK_TAGS).toEqual([
      'foundational',
      'core-full',
      'core-summary',
      'worked-easy',
      'worked-medium',
      'worked-hard',
      'practice',
      'common-mistakes',
      'recap',
    ])
  })

  it('exposes the canonical track list (matching tier names)', () => {
    expect(TRACKS).toEqual(['guided', 'balanced', 'exam_ready'])
  })

  it('returns a guided rule whose sequence is the full build-up', () => {
    expect(getTrackRule('guided')).toEqual([
      'foundational',
      'core-full',
      'worked-easy',
      'worked-medium',
      'practice',
      'recap',
    ])
  })

  it('returns a balanced rule with condensed core + medium example + practice + recap', () => {
    expect(getTrackRule('balanced')).toEqual([
      'core-summary',
      'worked-medium',
      'practice',
      'recap',
    ])
  })

  it('returns an exam_ready rule focused on hard examples and common mistakes', () => {
    expect(getTrackRule('exam_ready')).toEqual([
      'core-summary',
      'worked-hard',
      'common-mistakes',
      'practice',
    ])
  })

  it('falls back to the balanced rule for an unknown track name', () => {
    expect(getTrackRule('nonsense')).toEqual(getTrackRule('balanced'))
  })
})
