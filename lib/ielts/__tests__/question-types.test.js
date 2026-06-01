import { describe, it, expect } from 'vitest'
import {
  PRIMITIVES,
  getQuestionType,
  primitiveFor,
  isKnownQuestionType,
  allQuestionTypes,
} from '../question-types.js'

describe('question-type registry', () => {
  it('maps every type to one of the three primitives', () => {
    for (const type of allQuestionTypes()) {
      expect(PRIMITIVES).toContain(primitiveFor(type))
    }
  })
  it('covers the full IELTS spread across all three primitives', () => {
    const byPrimitive = allQuestionTypes().reduce((acc, t) => {
      const p = primitiveFor(t)
      acc[p] = (acc[p] ?? 0) + 1
      return acc
    }, {})
    expect(byPrimitive.single_select).toBeGreaterThan(0)
    expect(byPrimitive.multi_select).toBeGreaterThan(0)
    expect(byPrimitive.text_fill).toBeGreaterThan(0)
  })
  it('exposes fixed options for the True/False/Not Given family', () => {
    expect(getQuestionType('tfng').fixedOptions).toEqual(['TRUE', 'FALSE', 'NOT GIVEN'])
    expect(getQuestionType('ynng').fixedOptions).toEqual(['YES', 'NO', 'NOT GIVEN'])
  })
  it('returns null / false for unknown types', () => {
    expect(getQuestionType('nope')).toBe(null)
    expect(primitiveFor('nope')).toBe(null)
    expect(isKnownQuestionType('nope')).toBe(false)
    expect(isKnownQuestionType('tfng')).toBe(true)
  })
})
