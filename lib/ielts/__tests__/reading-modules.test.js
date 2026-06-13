import { describe, it, expect } from 'vitest'
import { nextModule, moduleForDrill, isExamUnlocked } from '../reading-modules.js'

const MODULES = [
  { slug: 'reading-tfng', position: 1, drill_item_id: 'drill-1' },
  { slug: 'reading-headings', position: 2, drill_item_id: 'drill-2' },
  { slug: 'reading-skim', position: 3, drill_item_id: null },
]

describe('moduleForDrill', () => {
  it('finds the module a drill item belongs to', () => {
    expect(moduleForDrill(MODULES, 'drill-2').slug).toBe('reading-headings')
  })
  it('returns null for an unknown drill', () => {
    expect(moduleForDrill(MODULES, 'nope')).toBeNull()
  })
})

describe('nextModule', () => {
  it('returns the next module by position', () => {
    expect(nextModule(MODULES, 'drill-1').slug).toBe('reading-headings')
  })
  it('returns null after the last module', () => {
    expect(nextModule(MODULES, 'drill-2')).toBeNull()
  })
})

describe('isExamUnlocked', () => {
  it('is false when not all drills are completed', () => {
    expect(isExamUnlocked(MODULES, ['drill-1'])).toBe(false)
  })
  it('is true when every module-with-a-drill is completed', () => {
    expect(isExamUnlocked(MODULES, ['drill-1', 'drill-2'])).toBe(true)
  })
  it('is false when there are no drillable modules', () => {
    expect(isExamUnlocked([{ slug: 'x', position: 1, drill_item_id: null }], [])).toBe(false)
  })
})
