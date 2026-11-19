// app/practice/page.js
//
// The IELTS hub: the Reading learning path, then the four test sections
// (Listening, Reading, Writing, Speaking) with their published practice items
// as cards. Reading is split into the timed mock exam, the question-type drills
// that belong to the Reading lessons, and extra practice passages. Auth-gated.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight, BookOpen, Clock, GraduationCap, Headphones, Mic, PenLine, Sparkles, Timer, Zap,
} from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { hrefForItem, subSkillLabel } from '@/lib/ielts/sections'
import { getQuestionType } from '@/lib/ielts/question-types'
import { READING_EXAM_ITEM_ID } from '@/lib/ielts/reading-modules'
import PracticeCard from '@/components/ielts/PracticeCard'

export const metadata = { title: 'IELTS practice' }

const SECTION_META = [
  {
    type: 'listening_set',
    id: 'listening',
    label: 'Listening',
    icon: Headphones,
    blurb: 'Listen to a recording and answer the questions as you go.',
  },
  {
    type: 'reading_set',
    id: 'reading',
    label: 'Reading',
    icon: BookOpen,
    blurb: 'Read a passage and answer questions about it.',
  },
  {
    type: 'writing_task',
    id: 'writing',
    label: 'Writing',
    icon: PenLine,
    blurb: 'Write a response to a real-style task and get band feedback on each criterion.',
  },
  {
    type: 'speaking_task',
    id: 'speaking',
    label: 'Speaking',
    icon: Mic,
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

  function cardProps(item) {
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
      let kicker = labels.length > 1 ? 'Mixed question types' : labels[0]
      if (drillOrder.has(item.id)) kicker = `Drill for lesson ${drillOrder.get(item.id)}`
      if (item.type === 'listening_set') kicker = p.section ? `Part ${p.section}` : 'Listening'
      return {
        ...base,
        kicker,
        facts,
        benefit: 'Auto-marked · instant score',
        benefitIcon: Zap,
      }
    }
    const facts = []
    if (p.time_limit_minutes) facts.push(`${p.time_limit_minutes} min`)
    if (p.minimum_words) facts.push(`${p.minimum_words}+ words`)
    if (p.prep_seconds) facts.push(`${minutes(p.prep_seconds)} to prepare`)
    if (p.speak_seconds) facts.push(`speak for ${minutes(p.speak_seconds)}`)
    return {
      ...base,
      kicker: subSkillLabel(item.sub_skill),
      facts,
      benefit: 'AI examiner feedback',
      benefitIcon: Sparkles,
    }
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
        { key: 'mock', title: 'Timed mock exam', note: 'Exam conditions with a countdown. Gives an estimated band score.', items: mocks, cta: 'Start exam' },
        { key: 'drills', title: 'Question-type drills', note: 'One question type per set. Each goes with a lesson in the Reading path.', items: drills },
        { key: 'more', title: 'More practice passages', note: 'Mixed question types, like the real test.', items: more },
      ].filter((g) => g.items.length > 0)
    }
    if (type === 'writing_task' || type === 'speaking_task') {
      list.sort((a, b) => SUB_SKILL_ORDER.indexOf(a.sub_skill) - SUB_SKILL_ORDER.indexOf(b.sub_skill))
    }
    return list.length ? [{ key: 'all', items: list }] : []
  }

  const sections = SECTION_META.map((s) => ({ ...s, groups: groupsFor(s.type) }))
  const hasAny = sections.some((s) => s.groups.length > 0)

  return (
    <div className="container-app py-6 sm:py-10">
      <p className="eyebrow !text-teal-700">IELTS preparation</p>
      <h1 className="h-page mt-2">Practise for IELTS</h1>
      <p className="lead mt-2 max-w-2xl">
        Pick a section and start a task. Listening and Reading are marked instantly. Writing and Speaking get feedback from an AI examiner.
      </p>

      {/* Section jump links */}
      <nav aria-label="IELTS sections" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 hover:border-teal-300 hover:bg-teal-50"
          >
            <s.icon className="h-4 w-4 text-teal-600" aria-hidden="true" /> {s.label}
          </a>
        ))}
      </nav>

      {/* Reading path */}
      {mods.length > 0 ? (
        <Link
          href="/learn/reading"
          className="group mt-6 flex flex-col gap-5 rounded-2xl bg-ink-900 p-5 text-white shadow-card transition-shadow hover:shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-7"
        >
          <div className="flex items-start gap-4">
            <span className="icon-tile bg-teal-500 text-white"><GraduationCap className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">Guided course</p>
              <p className="mt-1 font-display text-xl font-bold sm:text-2xl">Learn Reading step by step</p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-200">
                {mods.length} short lessons, one question type each. Learn the method, practise it, then take the final exam.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-teal-400" style={{ width: `${Math.round((lessonsDone / mods.length) * 100)}%` }} />
                </div>
                <span className="text-xs font-medium text-ink-200">{lessonsDone} of {mods.length} done</span>
              </div>
            </div>
          </div>
          <span className="btn-accent btn-lg w-full shrink-0 sm:w-auto">
            {lessonsDone === 0 ? 'Start learning' : lessonsDone === mods.length ? 'Review lessons' : 'Continue'}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </Link>
      ) : null}

      {!hasAny ? (
        <div className="card card-pad mt-10 text-center">
          <p className="text-ink-700">No practice tasks are published yet.</p>
          <p className="muted mt-1">New tasks appear here as soon as they are ready.</p>
          <Link href="/dashboard/student" className="btn-primary mt-4">Back to home</Link>
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24" aria-labelledby={`${s.id}-title`}>
              <div className="flex items-start gap-3">
                <span className="icon-tile bg-teal-50 text-teal-700"><s.icon className="h-5 w-5" aria-hidden="true" /></span>
                <div>
                  <h2 id={`${s.id}-title`} className="h-section">{s.label}</h2>
                  <p className="mt-0.5 text-sm text-ink-500">{s.blurb}</p>
                </div>
              </div>

              {s.groups.length === 0 ? (
                <p className="card card-pad mt-4 text-sm text-ink-500">
                  {s.label} tasks are being prepared. Try another section for now.
                </p>
              ) : (
                <div className="mt-5 space-y-7">
                  {s.groups.map((g) => (
                    <div key={g.key}>
                      {g.title ? (
                        <div className="mb-3">
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                            {g.key === 'mock' ? <Timer className="h-4 w-4 text-teal-600" aria-hidden="true" /> : null}
                            {g.key === 'drills' ? <BookOpen className="h-4 w-4 text-teal-600" aria-hidden="true" /> : null}
                            {g.key === 'more' ? <Clock className="h-4 w-4 text-teal-600" aria-hidden="true" /> : null}
                            {g.title}
                            <span className="font-normal text-ink-400">({g.items.length})</span>
                          </h3>
                          {g.note ? <p className="mt-0.5 text-sm text-ink-500">{g.note}</p> : null}
                        </div>
                      ) : null}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {g.items.map((item) => (
                          <PracticeCard key={item.id} {...cardProps(item)} cta={g.cta || 'Start'} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
