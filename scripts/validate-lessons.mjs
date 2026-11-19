// Validates every content/highschool/<subject>/*.json against SCHEMA.md
import fs from 'node:fs'
import path from 'node:path'

const root = path.join(process.cwd(), 'content', 'highschool')
const PALETTE = ['#0f172a', '#64748b', '#e2e8f0', '#2563eb', '#dbeafe', '#0d9488', '#f59e0b', '#e11d48', '#ffffff', '#fff']
let bad = 0
const ids = new Set()

function check(file, l) {
  const errs = []
  const need = (c, m) => { if (!c) errs.push(m) }
  const subject = path.basename(path.dirname(file))
  need(l.subject === subject, `subject must be "${subject}"`)
  need(l.id === `${l.subject}-${l.topicSlug}-${l.order}`, 'id must be <subject>-<topicSlug>-<order>')
  need(!ids.has(l.id), 'duplicate id'); ids.add(l.id)
  need(path.basename(file).startsWith(`${l.order}-`), 'filename must start with <order>-')
  for (const k of ['topic', 'topicSlug', 'title', 'summary']) need(typeof l[k] === 'string' && l[k].length > 2, `missing ${k}`)
  need([1, 2, 3, 4].includes(l.form), 'form 1-4'); need([1, 2, 3].includes(l.term), 'term 1-3')
  need(l.minutes >= 10 && l.minutes <= 25, 'minutes 10-25')
  need(Array.isArray(l.objectives) && l.objectives.length >= 3 && l.objectives.length <= 4, '3-4 objectives')
  need(Array.isArray(l.glossary) && l.glossary.length >= 4 && l.glossary.length <= 8, '4-8 glossary terms')
  const s = l.sections || []
  need(s.length >= 9 && s.length <= 14, `9-14 sections (got ${s.length})`)
  const count = t => s.filter(x => x.type === t).length
  need(s[0]?.type === 'explain', 'first section must be explain')
  need(count('example') >= 2, '>=2 example'); need(count('check') >= 2, '>=2 check')
  need(count('mistake') >= 1, '>=1 mistake'); need(count('summary') === 1 && s[s.length - 1]?.type === 'summary', 'exactly one summary, last')
  s.forEach((x, i) => {
    const at = `sections[${i}] (${x.type})`
    if (x.type === 'explain') {
      need(x.title && x.body, `${at}: title+body`)
      if (x.svg) {
        need(/^<svg [^>]*viewBox="0 0 \d+ \d+"/.test(x.svg) && x.svg.trim().endsWith('</svg>'), `${at}: svg must start with <svg ... viewBox> and end </svg>`)
        need(!/<script|href=|<image|<foreignObject/i.test(x.svg), `${at}: svg has forbidden content`)
        need(/aria-label="/.test(x.svg), `${at}: svg needs aria-label`)
        for (const c of x.svg.match(/#[0-9a-fA-F]{3,6}\b/g) || []) need(PALETTE.includes(c.toLowerCase()), `${at}: colour ${c} not in palette`)
      }
    } else if (x.type === 'example') {
      need(x.title && x.problem && Array.isArray(x.steps) && x.steps.length >= 2 && x.answer, `${at}: title, problem, >=2 steps, answer`)
    } else if (x.type === 'check') {
      need(x.question && Array.isArray(x.options) && x.options.length >= 3 && x.options.length <= 4, `${at}: question + 3-4 options`)
      need(Number.isInteger(x.answer) && x.answer >= 0 && x.answer < (x.options?.length || 0), `${at}: answer index`)
      need(x.explanation?.length > 20, `${at}: explanation`)
      need(s[i - 1]?.type !== 'check', `${at}: two checks in a row`)
    } else if (x.type === 'mistake') need(x.title && x.body, `${at}: title+body`)
    else if (x.type === 'summary') need(Array.isArray(x.bullets) && x.bullets.length >= 4 && x.bullets.length <= 6, `${at}: 4-6 bullets`)
    else errs.push(`${at}: unknown type`)
  })
  const q = l.quiz || []
  need(q.length === 8, `exactly 8 quiz questions (got ${q.length})`)
  q.forEach((x, i) => {
    need(x.question && Array.isArray(x.options) && x.options.length === 4, `quiz[${i}]: question + 4 options`)
    need(Number.isInteger(x.answer) && x.answer >= 0 && x.answer < 4, `quiz[${i}]: answer index`)
    need(x.explanation?.length > 20, `quiz[${i}]: explanation`)
    need(!(x.options || []).some(o => /^[A-D][).]\s/.test(o)), `quiz[${i}]: do not prefix options with letters`)
    need(new Set(x.options).size === 4, `quiz[${i}]: duplicate options`)
  })
  if (q.length === 8) need(new Set(q.map(x => x.answer)).size >= 3, 'quiz: vary the position of the correct answer')
  need(!/\*\*|\$\$|\\\\frac/.test(JSON.stringify(l)), 'no Markdown/LaTeX')
  return errs
}

for (const subject of fs.readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory())) {
  for (const f of fs.readdirSync(path.join(root, subject.name)).filter(f => f.endsWith('.json'))) {
    const file = path.join(root, subject.name, f)
    let errs
    try { errs = check(file, JSON.parse(fs.readFileSync(file, 'utf8'))) } catch (e) { errs = ['invalid JSON: ' + e.message] }
    if (errs.length) { bad++; console.log(`FAIL ${subject.name}/${f}\n  - ` + errs.join('\n  - ')) } else console.log(`OK   ${subject.name}/${f}`)
  }
}
process.exit(bad ? 1 : 0)
