// lib/blocks/block-selector.js
//
// Pure function: given a lesson's full block pool and a track name,
// return the ordered subset of blocks that track should render.
//
// Within a tag, blocks are kept in their `order_within_tag` ordering.
// A block whose tag is not in the track rule is dropped.

import { getTrackRule } from './track-rules.js'

export function selectBlocksForTrack(blocks, track) {
  if (!Array.isArray(blocks) || blocks.length === 0) return []

  const rule = getTrackRule(track)
  const byTag = new Map()

  for (const block of blocks) {
    if (!byTag.has(block.tag)) byTag.set(block.tag, [])
    byTag.get(block.tag).push(block)
  }

  for (const arr of byTag.values()) {
    arr.sort((a, b) => (a.order_within_tag ?? 0) - (b.order_within_tag ?? 0))
  }

  const out = []
  for (const tag of rule) {
    const blocksForTag = byTag.get(tag)
    if (blocksForTag) out.push(...blocksForTag)
  }
  return out
}
