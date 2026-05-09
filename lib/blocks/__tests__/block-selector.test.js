import { describe, it, expect } from 'vitest'
import { selectBlocksForTrack } from '../block-selector.js'

const POOL = [
  { id: 'b1', tag: 'foundational',    order_within_tag: 0, slides_data: { s: 'why' } },
  { id: 'b2', tag: 'core-full',       order_within_tag: 0, slides_data: { s: 'rule' } },
  { id: 'b3', tag: 'core-summary',    order_within_tag: 0, slides_data: { s: 'tldr' } },
  { id: 'b4', tag: 'worked-easy',     order_within_tag: 0, slides_data: { s: 'easy' } },
  { id: 'b5', tag: 'worked-medium',   order_within_tag: 0, slides_data: { s: 'med' } },
  { id: 'b6', tag: 'worked-medium',   order_within_tag: 1, slides_data: { s: 'med2' } },
  { id: 'b7', tag: 'worked-hard',     order_within_tag: 0, slides_data: { s: 'hard' } },
  { id: 'b8', tag: 'practice',        order_within_tag: 0, slides_data: { s: 'practice' } },
  { id: 'b9', tag: 'common-mistakes', order_within_tag: 0, slides_data: { s: 'mistakes' } },
  { id: 'b10', tag: 'recap',          order_within_tag: 0, slides_data: { s: 'recap' } },
]

describe('selectBlocksForTrack', () => {
  it('builds the guided sequence: foundational → core-full → worked-easy → worked-medium (in order_within_tag) → practice → recap', () => {
    const result = selectBlocksForTrack(POOL, 'guided')
    expect(result.map(b => b.id)).toEqual(['b1', 'b2', 'b4', 'b5', 'b6', 'b8', 'b10'])
  })

  it('builds the balanced sequence: core-summary → worked-medium → practice → recap', () => {
    const result = selectBlocksForTrack(POOL, 'balanced')
    expect(result.map(b => b.id)).toEqual(['b3', 'b5', 'b6', 'b8', 'b10'])
  })

  it('builds the exam_ready sequence: core-summary → worked-hard → common-mistakes → practice', () => {
    const result = selectBlocksForTrack(POOL, 'exam_ready')
    expect(result.map(b => b.id)).toEqual(['b3', 'b7', 'b9', 'b8'])
  })

  it('skips a tag entirely if the pool has no blocks for it', () => {
    const partialPool = POOL.filter(b => b.tag !== 'worked-medium')
    const result = selectBlocksForTrack(partialPool, 'guided')
    expect(result.map(b => b.id)).toEqual(['b1', 'b2', 'b4', 'b8', 'b10'])
  })

  it('returns an empty array if the pool is empty', () => {
    expect(selectBlocksForTrack([], 'guided')).toEqual([])
  })

  it('orders blocks within a tag by order_within_tag ascending', () => {
    const reversed = [
      { id: 'b6', tag: 'worked-medium', order_within_tag: 1 },
      { id: 'b5', tag: 'worked-medium', order_within_tag: 0 },
      { id: 'b3', tag: 'core-summary',  order_within_tag: 0 },
      { id: 'b8', tag: 'practice',      order_within_tag: 0 },
      { id: 'b10', tag: 'recap',        order_within_tag: 0 },
    ]
    const result = selectBlocksForTrack(reversed, 'balanced')
    expect(result.map(b => b.id)).toEqual(['b3', 'b5', 'b6', 'b8', 'b10'])
  })
})
