// app/practice/page.js
//
// The IELTS hub: a four-skill index, the guided Reading path (the chalkboard),
// then the four test sections (Listening, Reading, Writing, Speaking) with
// their published practice items as ruled contents rows. Reading is split into
// the timed mock exam, the question-type drills that belong to the Reading
// lessons, and extra practice passages. Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { hrefForItem, subSkillLabel } from '@/lib/ielts/sections'
import { getQuestionType } from '@/lib/ielts/question-types'
import { READING_EXAM_ITEM_ID } from '@/lib/ielts/reading-modules'
import PracticeCard from '@/components/ielts/PracticeCard'
import SubjectArt from '@/components/art/SubjectArt'
import ChalkDoodles from '@/components/art/ChalkDoodles'
import Segments from '@/components/kit/Segments'

export const metadata = { title: 'IELTS practice' }

const SECTION_META = [
  {
    type: 'listening_set',
    id: 'listening',
    label: 'Listening',
    noun: 'set',
    blurb: 'Listen to a recording and answer the questions as you go.',
  },
  {
    type: 'reading_set',
    id: 'reading',
    label: 'Reading',
    noun: 'set',
    blurb: 'Read a passage and answer questions about it.',
  },
  {
    type: 'writing_task',
    id: 'writing',
    label: 'Writing',
    noun: 'task',
    blurb: 'Write a response to a real-style task and get band feedback on each criterion.',
  },
  {
    type: 'speaking_task',
    id: 'speaking',
    label: 'Speaking',
    noun: 'task',
    blurb: 'Record your answer to an examiner question and get feedback on how you spoke.',
  },
]

const SUB_SKILL_ORDER = [
  'writing-task-1-academic', 'writing-task-1-general', 'writing-task-2',
  'speaking-part-1', 'speaking-part-2', 'speaking-part-3',
]

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function minutes(seconds) {
  if (seconds % 60 === 0) return `${seconds / 60} min`
  if (seconds < 120) return `${seconds} sec`
  return `about ${Math.round(seconds / 60)} min`
}

function typeLabels(types) {
  return [...new Set(types)].map((t) => getQuestionType(t)?.label).filter(Boolean)
}

function capitalise(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

export default async function IeltsHubPage() {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/practice')

  const [{ data: items }, { data: lessons }, { data: subs }] = await Promise.all([
    supabase
      .from('practice_items')
      .select('id, type, sub_skill, variant, difficulty_band, payload, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: true }),
    supabase
      .from('skill_lessons')
      .select('slug, title, drill_item_id, position')
      .eq('section', 'reading')
      .eq('status', 'published')
      .order('position', { ascending: true }),
    supabase
      .from('submissions')
      .select('practice_item_id')
      .eq('user_id', user.id)
      .eq('status', 'graded'),
  ])

  const all = items ?? []
  const mods = lessons ?? []
  const doneIds = new Set((subs ?? []).map((s) => s.practice_item_id))

  // Question count + question types for the auto-marked sets.
  const setIds = all.filter((i) => i.type === 'reading_set' || i.type === 'listening_set').map((i) => i.id)
  const questionsByItem = {}
  if (setIds.length > 0) {
    const { data: qs } = await supabase
      .from('practice_questions')
      .select('practice_item_id, question_type')
      .in('practice_item_id', setIds)
    for (const q of qs ?? []) {
      ;(questionsByItem[q.practice_item_id] ??= []).push(q.question_type)
    }
  }

  const drillOrder = new Map(mods.filter((m) => m.drill_item_id).map((m) => [m.drill_item_id, m.position ?? 0]))
  const lessonsDone = mods.filter((m) => m.drill_item_id && doneIds.has(m.drill_item_id)).length

  function rowProps(item, groupKey) {
    const p = item.payload ?? {}
    const qTypes = questionsByItem[item.id] ?? []
    const base = {
      href: hrefForItem(item),
      title: p.title || subSkillLabel(item.sub_skill),
      band: item.difficulty_band,
      done: doneIds.has(item.id),
    }
    if (item.type === 'reading_set' || item.type === 'listening_set') {
      const facts = []
      if (qTypes.length) facts.push(plural(qTypes.length, 'question'))
      if (p.time_limit_seconds) facts.push(`${minutes(p.time_limit_seconds)} timed`)
      else if (p.minimum_reading_minutes) facts.push(`about ${p.minimum_reading_minutes} min`)
      const labels = typeLabels(qTypes)
      // The "more passages" group already says its sets mix question types.
      let kicker = labels.length > 1 ? (groupKey === 'more' ? null : 'Mixed question types') : labels[0]
      if (drillOrder.has(item.id)) kicker = `Goes with lesson ${drillOrder.get(item.id)}`
      if (item.type === 'listening_set') kicker = p.section ? `Part ${p.section}` : null
      return { ...base, kicker, facts }
    }
    const facts = []
    if (p.time_limit_minutes) facts.push(`${p.time_limit_minutes} min`)
    if (p.minimum_words) facts.push(`${p.minimum_words}+ words`)
    if (p.prep_seconds) facts.push(`${minutes(p.prep_seconds)} to prepare`)
    if (p.speak_seconds) facts.push(`speak for ${minutes(p.speak_seconds)}`)
    if (facts.length) facts[0] = capitalise(facts[0])
    return { ...base, kicker: subSkillLabel(item.sub_skill), facts }
  }

  function groupsFor(type) {
    const list = all.filter((i) => i.type === type)
    if (type === 'reading_set') {
      const mocks = list.filter((i) => i.payload?.is_mock || i.id === READING_EXAM_ITEM_ID)
      const drills = list
        .filter((i) => !mocks.includes(i) && drillOrder.has(i.id))
        .sort((a, b) => drillOrder.get(a.id) - drillOrder.get(b.id))
      const more = list.filter((i) => !mocks.includes(i) && !drillOrder.has(i.id))
      return [
        { key: 'mock', title: 'Timed mock exam', note: 'Exam conditions with a countdown. Gives an estimated band score.', items: mocks, cta: 'Start exam', featured: true },
        { key: 'drills', title: 'Question-type drills', note: 'One question type per set. Each goes with a lesson in the Reading path.', items: drills },
        { key: 'more', title: 'More practice passages', note: 'Mixed question types, like the real test.', items: more },
      ].filter((g) => g.items.length > 0)
    }
    if (type === 'writing_task' || type === 'speaking_task') {
      list.sort((a, b) => SUB_SKILL_ORDER.indexOf(a.sub_skill) - SUB_SKILL_ORDER.indexOf(b.sub_skill))
    }
    return list.length ? [{ key: 'all', items: list }] : []
  }

  const sections = SECTION_META.map((s) => {
    const groups = groupsFor(s.type)
    return { ...s, groups, count: groups.reduce((n, g) => n + g.items.length, 0) }
  })
  const hasAny = sections.some((s) => s.count > 0)
  const pathAction = lessonsDone === 0 ? 'Start learning' : lessonsDone === mods.length ? 'Review lessons' : 'Continue'

  return (
    <div className="container-app pb-16 pt-10 sm:pt-16">
      <header className="max-w-3xl">
        <p className="eyebrow !text-copper-700">IELTS preparation</p>
        <h1 className="h-display mt-3 text-balance">Practise for IELTS.</h1>
        <p className="lead mt-5">
          Listening and Reading are marked instantly, with the reason for every answer. Writing and Speaking get
          examiner-style feedback from AI on each band criterion (this demo may show sample feedback).
        </p>
      </header>

      {/* The four skills: an index that jumps to each section */}
      <nav aria-label="IELTS sections" className="mt-10 sm:mt-14">
        <ul className="grid grid-cols-2 gap-x-5 gap-y-6 lg:grid-cols-4 lg:gap-x-8">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="group flex min-h-[44px] flex-col gap-3 border-t-2 border-ink-900 pt-4 sm:flex-row sm:items-center sm:gap-4">
                <SubjectArt name={s.id} tone="copper" className="h-14 w-14 sm:h-16 sm:w-16" />
                <span>
                  <span
                    className="block font-display text-[1.25rem] font-semibold leading-tight text-ink-900 decoration-ink-900 decoration-2 underline-offset-4 group-hover:underline sm:text-[1.375rem]"
                    style={{ letterSpacing: '-0.015em' }}
                  >
                    {s.label}
                  </span>
                  <span className="mt-1 block text-[13px] font-semibold text-ink-500 tabular">
                    {s.count > 0 ? plural(s.count, s.noun) : 'Coming soon'}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Guided Reading course: the one chalkboard on this screen */}
      {mods.length > 0 ? (
        <Link href="/learn/reading" className="board group mt-12 block p-6 sm:mt-16 sm:p-10 lg:p-12">
          <ChalkDoodles variant="language" />
          <p className="text-[13px] font-bold text-sun-300">Guided course</p>
          <h2
            className="mt-2 max-w-xl font-display text-[1.75rem] font-semibold leading-[1.1] text-chalk sm:text-[2.375rem]"
            style={{ letterSpacing: '-0.025em' }}
          >
            Learn Reading step by step
          </h2>
          <p className="board-soft mt-3 max-w-[50ch] text-[15px] leading-relaxed sm:text-[17px]">
            {plural(mods.length, 'short lesson')}, one question type each. Learn the method, practise it, then take the final exam.
          </p>
          <div className="mt-6 max-w-[260px]">
            <Segments total={mods.length} done={lessonsDone} tone="chalk" label={`${lessonsDone} of ${mods.length} lessons done`} />
            <p className="board-soft mt-2 text-[13px] font-semibold">
              <span className="text-chalk">{lessonsDone} of {mods.length}</span> lessons done
            </p>
          </div>
          <span className="btn-chalk mt-6 w-full sm:w-auto">
            {pathAction} <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      ) : null}

      {!hasAny ? (
        <div className="mt-16 max-w-xl border-t-2 border-ink-900 pt-5">
          <h2 className="h-section">No practice tasks are published yet</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600">New tasks appear here as soon as they are ready.</p>
          <Link href="/dashboard/student" className="btn-primary mt-5">Back to home</Link>
        </div>
      ) : (
        <div className="mt-16 space-y-16 sm:mt-24 sm:space-y-20">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24" aria-labelledby={`${s.id}-title`}>
              <header className="rule-head flex-wrap items-end">
                <div>
                  <h2 id={`${s.id}-title`} className="h-section">{s.label}</h2>
                  <p className="mt-0.5 text-[15px] leading-snug text-ink-600">{s.blurb}</p>
                </div>
                {s.count > 0 ? <p className="hidden text-[13px] font-semibold text-ink-500 tabular sm:block">{plural(s.count, s.noun)}</p> : null}
              </header>

              {s.groups.length === 0 ? (
                <p className="border-b border-ink-200 py-5 text-[15px] text-ink-600">
                  {s.label} tasks are being prepared. Try another section for now.
                </p>
              ) : (
                s.groups.map((g, gi) => (
                  <div key={g.key} className={g.title ? (gi === 0 ? 'mt-6' : 'mt-10') : ''}>
                    {g.title ? (
                      <div className="pb-2.5">
                        <h3 className="h-sub">
                          {g.title} <span className="ml-1 font-semibold text-ink-500 tabular">{g.items.length}</span>
                        </h3>
                        {g.note ? <p className="mt-0.5 text-[15px] leading-snug text-ink-600">{g.note}</p> : null}
                      </div>
                    ) : null}
                    <ul className={`rows ${g.title ? 'border-t border-ink-300' : ''}`}>
                      {g.items.map((item) => (
                        <PracticeCard key={item.id} {...rowProps(item, g.key)} cta={g.cta || 'Start'} featured={!!g.featured} />
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
