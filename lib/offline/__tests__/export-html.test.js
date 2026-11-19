import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { escapeHtml, exportFileName, lessonToHtml } from '../export-html.js'
import { groupSaved, toRecord, formatBytes } from '../store.js'

const ROOT = path.join(process.cwd(), 'content', 'highschool')

function readLesson(subject, file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, subject, file), 'utf8'))
}

function allLessons() {
  const out = []
  for (const subject of fs.readdirSync(ROOT)) {
    const dir = path.join(ROOT, subject)
    if (!fs.statSync(dir).isDirectory()) continue
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      out.push({ ...readLesson(subject, file), slug: file.replace(/\.json$/, '') })
    }
  }
  return out
}

const nasty = {
  id: 'test-nasty-1',
  subject: 'mathematics',
  form: 1,
  term: 2,
  topic: 'Inequalities <b>& more</b>',
  topicSlug: 'inequalities',
  order: 1,
  title: 'When is a < b? <script>alert("x")</script>',
  summary: 'Compare numbers with <, > & "quotes" and it\'s fine.',
  minutes: 10,
  objectives: ['Use < and > correctly', 'Say "less than" & "greater than"'],
  sections: [
    { type: 'explain', title: 'Signs: < & >', body: 'First paragraph with <i>tags</i>.\n\nSecond paragraph & more.', bullets: ['3 < 5', '5 > 3'], svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img" aria-label="dot"><circle cx="5" cy="5" r="4" fill="#2563EB"/></svg>' },
    { type: 'example', title: 'Worked example: order <these>', problem: 'Is 2 < 3 && 3 > 2?', steps: ['Step 1: 2 < 3 is true.', 'Step 2: 3 > 2 is true.'], answer: 'Yes — both are "true"' },
    { type: 'check', question: 'Which is true: a) 1 < 2 or b) 1 > 2?', options: ['1 < 2', '1 > 2', '</script><script>alert(1)</script>'], answer: 0, explanation: '1 is less than 2, so "1 < 2" is true.' },
    { type: 'mistake', title: 'Common mistake: mixing < and >', body: 'The small end points at the small number: 2 < 9.' },
    { type: 'summary', title: 'Key points', bullets: ['< means less than', '> means greater than'] },
  ],
  quiz: [
    { question: 'Pick the true statement: <one>', options: ['7 < 4', '4 < 7', '4 > 7', '7 = 4'], answer: 1, explanation: '4 is less than 7 & that is that.' },
  ],
  glossary: [{ term: 'Inequality <sign>', definition: 'A sign such as < or > that compares "two" values.' }],
}

describe('escapeHtml', () => {
  it('escapes the five special characters', () => {
    expect(escapeHtml(`<a href="x" title='y'>T&C</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;T&amp;C&lt;/a&gt;')
  })

  it('handles null, undefined and numbers', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml(15)).toBe('15')
  })
})

describe('exportFileName', () => {
  it('builds a safe file name from the lesson id', () => {
    expect(exportFileName({ id: 'mathematics-fractions-1' })).toBe('rent-a-tutor-mathematics-fractions-1.html')
    expect(exportFileName({ id: '../Weird ID/<x>' })).toBe('rent-a-tutor-weird-id-x.html')
    expect(exportFileName({})).toBe('rent-a-tutor-lesson.html')
  })
})

describe('lessonToHtml — escaping', () => {
  const html = lessonToHtml(nasty)

  it('never lets lesson text become markup', () => {
    expect(html).not.toContain('<script>alert')
    expect(html).not.toContain('<b>&')
    expect(html).not.toContain('<i>tags</i>')
    expect(html).not.toContain('<these>')
    expect(html).not.toContain('<one>')
    expect(html).not.toContain('<sign>')
  })

  it('keeps the text, escaped', () => {
    expect(html).toContain('When is a &lt; b? &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
    expect(html).toContain('Inequalities &lt;b&gt;&amp; more&lt;/b&gt;')
    expect(html).toContain('&lt;/script&gt;&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('it&#39;s fine')
    expect(html).toContain('Say &quot;less than&quot; &amp; &quot;greater than&quot;')
    expect(html).toContain('Inequality &lt;sign&gt;')
  })

  it('contains exactly one inline script and one closing script tag', () => {
    expect(html.match(/<script>/g)).toHaveLength(1)
    expect(html.match(/<\/script>/g)).toHaveLength(1)
  })

  it('inserts the trusted SVG as-is', () => {
    expect(html).toContain(nasty.sections[0].svg)
  })

  it('splits body text into paragraphs', () => {
    expect(html).toContain('<p>First paragraph with &lt;i&gt;tags&lt;/i&gt;.</p>')
    expect(html).toContain('<p>Second paragraph &amp; more.</p>')
  })

  it('marks the right answer in the markup, not in the script', () => {
    expect(html).toContain('<div class="q" data-answer="1">')
    expect(html).toContain('class="opt is-answer" data-i="1"')
  })

  it('is self-contained: no external requests', () => {
    expect(html).not.toMatch(/<link\b/i)
    expect(html).not.toMatch(/<script[^>]+src=/i)
    expect(html).not.toMatch(/<img\b/i)
    expect(html).not.toMatch(/@import/i)
    expect(html).not.toMatch(/url\(/i)
    expect(html).toContain('@media print')
    expect(html).toContain('Rent a Tutor — offline lesson')
  })
})

describe('lessonToHtml — real lessons', () => {
  const lessons = allLessons()

  it('finds the lesson files', () => {
    expect(lessons.length).toBeGreaterThan(0)
  })

  it.each(lessons.map((l) => [l.id, l]))('%s: every section title, check and quiz question appears', (_id, lesson) => {
    const html = lessonToHtml(lesson)
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain(`<h1>${escapeHtml(lesson.title)}</h1>`)
    for (const o of lesson.objectives) expect(html).toContain(escapeHtml(o))
    for (const s of lesson.sections) {
      if (s.type === 'check') {
        expect(html).toContain(escapeHtml(s.question))
        expect(html).toContain(escapeHtml(s.explanation))
        for (const opt of s.options) expect(html).toContain(escapeHtml(opt))
      } else {
        const title = String(s.title).replace(/^(Worked example|Common mistake):\s*/i, '')
        expect(html).toContain(escapeHtml(title))
      }
      if (s.svg) expect(html).toContain(s.svg)
      if (s.type === 'example') {
        expect(html).toContain(escapeHtml(s.problem))
        expect(html).toContain(escapeHtml(s.answer))
      }
    }
    for (const q of lesson.quiz) {
      expect(html).toContain(escapeHtml(q.question))
      expect(html).toContain(escapeHtml(q.explanation))
      for (const opt of q.options) expect(html).toContain(escapeHtml(opt))
    }
    for (const g of lesson.glossary) expect(html).toContain(escapeHtml(g.term))
    expect(html.match(/class="q"/g)).toHaveLength(lesson.quiz.length + lesson.sections.filter((s) => s.type === 'check').length)
    expect(html.match(/<script>/g)).toHaveLength(1)
  })
})

describe('lessonToHtml — IELTS reading shape', () => {
  const ielts = {
    id: 'ielts-reading-skimming',
    course: 'ielts',
    subject: 'ielts-reading',
    topic: 'Reading strategies',
    title: 'Skimming for the main idea',
    summary: 'Read fast for the gist.',
    minutes: 8,
    objectives: [],
    quiz: [],
    sections: [
      { type: 'explain', title: 'What skimming is', body: 'Read the first sentence of each paragraph.' },
      { type: 'summary', title: 'Key points', bullets: ['Read first sentences'] },
    ],
  }

  it('renders without a quiz, objectives, form or glossary', () => {
    const html = lessonToHtml(ielts)
    expect(html).toContain('Skimming for the main idea')
    expect(html).toContain('IELTS Reading')
    expect(html).not.toContain('id="quiz"')
    expect(html).not.toContain('By the end you will be able to')
    expect(html).not.toContain('Form ')
    expect(html).not.toContain('Key words')
  })

  it('throws a clear error for something that is not a lesson', () => {
    expect(() => lessonToHtml(null)).toThrow(/lesson/)
    expect(() => lessonToHtml({ title: 'x' })).toThrow(/sections/)
  })

  it('is stored with its course, and high-school lessons default to highschool', () => {
    expect(toRecord(ielts).course).toBe('ielts')
    const hs = toRecord(nasty)
    expect(hs.course).toBe('highschool')
    expect(hs.lesson.course).toBe('highschool')
    expect(hs.bytes).toBeGreaterThan(100)
    expect(() => toRecord({ title: 'no sections' })).toThrow()
  })

  it('groups saved lessons by course, then subject and topic', () => {
    const groups = groupSaved([toRecord(ielts), toRecord(nasty), toRecord({ ...nasty, id: 'test-nasty-2', order: 2 })])
    expect(groups.map((g) => g.course)).toEqual(['highschool', 'ielts'])
    expect(groups[0].name).toBe('High School')
    expect(groups[0].groups).toHaveLength(1)
    expect(groups[0].groups[0].records).toHaveLength(2)
    expect(groups[1].groups[0].records[0].id).toBe('ielts-reading-skimming')
  })

  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(20480)).toBe('20 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})
