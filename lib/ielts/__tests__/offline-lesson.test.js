import { describe, it, expect } from 'vitest'
import { toOfflineLesson } from '../offline-lesson.js'

const ROW = {
  slug: 'reading-tfng',
  title: 'True / False / Not Given',
  summary: 'Decide if statements agree with the passage.',
  position: 1,
  slides_data: {
    blocks: [
      { tag: 'foundational', title: 'What this question asks', content: 'You decide.', bullets: ['TRUE', 'FALSE'] },
      { title: '', content: '   ', bullets: [] },
      { title: 'Try one', content: 'Read the line.', answer: 'NOT GIVEN' },
    ],
  },
}

describe('toOfflineLesson', () => {
  it('maps the lesson metadata', () => {
    const l = toOfflineLesson(ROW)
    expect(l.id).toBe('ielts-reading-reading-tfng')
    expect(l.course).toBe('ielts')
    expect(l.subject).toBe('ielts-reading')
    expect(l.topic).toBe('IELTS Reading')
    expect(l.topicSlug).toBe('ielts-reading')
    expect(l.order).toBe(1)
    expect(l.title).toBe('True / False / Not Given')
    expect(l.summary).toBe('Decide if statements agree with the passage.')
    expect(l.objectives).toEqual([])
    expect(l.quiz).toEqual([])
    expect(l.glossary).toEqual([])
  })

  it('turns slides into explain sections and skips empty slides', () => {
    const l = toOfflineLesson(ROW)
    expect(l.sections).toHaveLength(2)
    expect(l.sections[0]).toEqual({
      type: 'explain',
      title: 'What this question asks',
      body: 'You decide.',
      bullets: ['TRUE', 'FALSE'],
    })
    expect(l.sections[1].body).toContain('Answer: NOT GIVEN')
  })

  it('estimates about a minute per slide, at least 5', () => {
    expect(toOfflineLesson(ROW).minutes).toBe(5)
    const many = { ...ROW, slides_data: { blocks: Array.from({ length: 8 }, (_, i) => ({ title: `S${i}` })) } }
    expect(toOfflineLesson(many).minutes).toBe(8)
  })

  it('copes with missing slides', () => {
    const l = toOfflineLesson({ slug: 'x', title: 'X' })
    expect(l.sections).toEqual([])
    expect(l.minutes).toBe(5)
  })
})
