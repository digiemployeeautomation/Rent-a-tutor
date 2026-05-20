import { describe, it, expect } from 'vitest'
import { stubGradeWriting } from '../stub-grader.js'

describe('stubGradeWriting', () => {
  it('returns all-zeros for empty response', () => {
    const grade = stubGradeWriting({ taskType: 'writing-task-2', taskPrompt: 'p', responseText: '' })
    expect(grade.band_overall).toBe(0.0)
    expect(grade.band_per_criterion.task_response).toBe(0.0)
  })

  it('returns minimum band for very short responses', () => {
    const grade = stubGradeWriting({ taskType: 'writing-task-2', taskPrompt: 'p', responseText: 'I agree with this.' })
    expect(grade.band_overall).toBe(4.0)
  })

  it('returns higher band for longer responses', () => {
    const short = stubGradeWriting({
      taskType: 'writing-task-2', taskPrompt: 'p',
      responseText: Array(100).fill('word').join(' '),
    })
    const long = stubGradeWriting({
      taskType: 'writing-task-2', taskPrompt: 'p',
      responseText: Array(300).fill('word').join(' '),
    })
    expect(long.band_overall).toBeGreaterThan(short.band_overall)
  })

  it('caps at maximum band for very long responses', () => {
    const huge = stubGradeWriting({
      taskType: 'writing-task-2', taskPrompt: 'p',
      responseText: Array(1000).fill('word').join(' '),
    })
    expect(huge.band_overall).toBe(7.5)
  })

  it('produces band-per-criterion values within 0.5 of the overall', () => {
    const grade = stubGradeWriting({
      taskType: 'writing-task-2', taskPrompt: 'p',
      responseText: Array(200).fill('word').join(' '),
    })
    for (const v of Object.values(grade.band_per_criterion)) {
      expect(Math.abs(v - grade.band_overall)).toBeLessThanOrEqual(0.5)
    }
  })

  it('is deterministic for the same input', () => {
    const args = { taskType: 'writing-task-2', taskPrompt: 'p', responseText: 'a b c d e f g h i j' }
    const a = stubGradeWriting(args)
    const b = stubGradeWriting(args)
    expect(a).toEqual(b)
  })
})
