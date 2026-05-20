import { describe, it, expect } from 'vitest'
import {
  isValidProfile,
  inferTrackFromBand,
  initialUserTracks,
  VARIANTS,
  SECTIONS,
  SUB_SKILLS,
  TRACKS,
} from '../onboarding.js'

describe('VARIANTS / SECTIONS / SUB_SKILLS / TRACKS constants', () => {
  it('exposes the canonical variant list', () => {
    expect(VARIANTS).toEqual(['academic', 'general'])
  })

  it('exposes the four IELTS sections', () => {
    expect(SECTIONS).toEqual(['listening', 'reading', 'writing', 'speaking'])
  })

  it('exposes the canonical sub-skill list', () => {
    expect(SUB_SKILLS).toEqual([
      'listening',
      'reading',
      'writing-task-1-academic',
      'writing-task-1-general',
      'writing-task-2',
      'speaking-part-1',
      'speaking-part-2',
      'speaking-part-3',
    ])
  })

  it('exposes the canonical track list', () => {
    expect(TRACKS).toEqual(['foundation', 'practice', 'mock'])
  })
})

describe('isValidProfile', () => {
  it('accepts a complete academic profile', () => {
    expect(isValidProfile({ variant: 'academic', target_band: 7.0, hours_per_week: 5 })).toBe(true)
  })

  it('accepts a complete general profile', () => {
    expect(isValidProfile({ variant: 'general', target_band: 6.0, hours_per_week: 10 })).toBe(true)
  })

  it('rejects null/undefined input', () => {
    expect(isValidProfile(null)).toBe(false)
    expect(isValidProfile(undefined)).toBe(false)
  })

  it('rejects unknown variant', () => {
    expect(isValidProfile({ variant: 'life-skills', target_band: 7.0, hours_per_week: 5 })).toBe(false)
  })

  it('rejects missing variant', () => {
    expect(isValidProfile({ target_band: 7.0, hours_per_week: 5 })).toBe(false)
  })

  it('rejects out-of-range target band', () => {
    expect(isValidProfile({ variant: 'academic', target_band: 3.5, hours_per_week: 5 })).toBe(false)
    expect(isValidProfile({ variant: 'academic', target_band: 9.5, hours_per_week: 5 })).toBe(false)
  })

  it('rejects non-numeric or zero hours_per_week', () => {
    expect(isValidProfile({ variant: 'academic', target_band: 7.0, hours_per_week: '5' })).toBe(false)
    expect(isValidProfile({ variant: 'academic', target_band: 7.0, hours_per_week: 0 })).toBe(false)
  })

  it('rejects unknown weakest_section value', () => {
    expect(isValidProfile({
      variant: 'academic', target_band: 7.0, hours_per_week: 5, weakest_section: 'pronunciation',
    })).toBe(false)
  })

  it('accepts an absent weakest_section', () => {
    expect(isValidProfile({ variant: 'academic', target_band: 7.0, hours_per_week: 5 })).toBe(true)
  })

  it('rejects out-of-range current_band_self', () => {
    expect(isValidProfile({
      variant: 'academic', target_band: 7.0, hours_per_week: 5, current_band_self: 12,
    })).toBe(false)
  })
})

describe('inferTrackFromBand', () => {
  it('defaults to practice when band is null/undefined', () => {
    expect(inferTrackFromBand(null)).toBe('practice')
    expect(inferTrackFromBand(undefined)).toBe('practice')
  })

  it('foundation for ≤5.5', () => {
    expect(inferTrackFromBand(4.0)).toBe('foundation')
    expect(inferTrackFromBand(5.0)).toBe('foundation')
    expect(inferTrackFromBand(5.5)).toBe('foundation')
  })

  it('practice for 6.0–6.5', () => {
    expect(inferTrackFromBand(6.0)).toBe('practice')
    expect(inferTrackFromBand(6.5)).toBe('practice')
  })

  it('mock for ≥7.0', () => {
    expect(inferTrackFromBand(7.0)).toBe('mock')
    expect(inferTrackFromBand(8.5)).toBe('mock')
    expect(inferTrackFromBand(9.0)).toBe('mock')
  })
})

describe('initialUserTracks', () => {
  it('returns 7 sub-skill assignments for an academic profile', () => {
    const tracks = initialUserTracks({ variant: 'academic', target_band: 7.0, hours_per_week: 5 })
    expect(tracks).toHaveLength(7)
    const subSkills = tracks.map((t) => t.sub_skill).sort()
    expect(subSkills).toContain('writing-task-1-academic')
    expect(subSkills).not.toContain('writing-task-1-general')
  })

  it('returns 7 sub-skill assignments for a general profile, with the general Task 1', () => {
    const tracks = initialUserTracks({ variant: 'general', target_band: 6.0, hours_per_week: 5 })
    const subSkills = tracks.map((t) => t.sub_skill).sort()
    expect(subSkills).toContain('writing-task-1-general')
    expect(subSkills).not.toContain('writing-task-1-academic')
  })

  it('marks inferred_from as self_declared when current_band_self is provided', () => {
    const tracks = initialUserTracks({
      variant: 'academic', target_band: 7.0, hours_per_week: 5, current_band_self: 6.0,
    })
    expect(tracks.every((t) => t.inferred_from === 'self_declared')).toBe(true)
    expect(tracks.every((t) => t.track === 'practice')).toBe(true)
  })

  it('marks inferred_from as default when current_band_self is absent', () => {
    const tracks = initialUserTracks({ variant: 'academic', target_band: 7.0, hours_per_week: 5 })
    expect(tracks.every((t) => t.inferred_from === 'default')).toBe(true)
    expect(tracks.every((t) => t.track === 'practice')).toBe(true)
  })
})
