// app/dashboard/student/page.js
//
// Student home. Serves both courses: the "continue" chalkboard for the next
// high-school lesson, a ruled section per course, recent activity and an
// offline note. Every number comes from the database or the lesson catalog.
// IELTS onboarding is optional — never forced from here.
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { getAllLessons, getSubjects, toSummary } from '@/lib/highschool/catalog'
import { lessonHref } from '@/lib/highschool/subjects'
import { sectionForType, labelForType, subSkillLabel } from '@/lib/ielts/sections'
import DemoNotice from '@/components/dashboard/DemoNotice'
import ContinueBoard from '@/components/dashboard/ContinueBoard'
import HighSchoolPanel from '@/components/dashboard/HighSchoolPanel'
import IeltsPanel from '@/components/dashboard/IeltsPanel'
import RecentActivity from '@/components/dashboard/RecentActivity'
import OfflineNote from '@/components/dashboard/OfflineNote'

export const metadata = { title: 'Home' }
export const dynamic = 'force-dynamic'

const ACTIVITY_LIMIT = 6

export default async function StudentDashboardPage() {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/student')

  // ── Database reads (all user-scoped, RLS applies) ────────────────────
  const [profileRes, hsRes, modulesRes, subsRes] = await Promise.all([
    supabase.from('user_ielts_profile').select('variant, target_band, test_date, weakest_section, hours_per_week').eq('user_id', user.id).maybeSingle(),
    supabase.from('hs_lesson_progress').select('lesson_id, score, total, passed, attempts, completed_at').eq('user_id', user.id),
    supabase.from('skill_lessons').select('drill_item_id, position').eq('section', 'reading').eq('status', 'published'),
    supabase.from('submissions').select('id, practice_item_id, status, started_at, submitted_at').eq('user_id', user.id).order('started_at', { ascending: false }).limit(30),
  ])

  const profile = profileRes.data ?? null
  const hsRows = hsRes.data ?? []
  const subs = subsRes.data ?? []
  const drillIds = (modulesRes.data ?? []).map((m) => m.drill_item_id).filter(Boolean)
  const subIds = subs.map((s) => s.id)
  const itemIds = [...new Set(subs.map((s) => s.practice_item_id))]

  const [gradesRes, itemsRes, drillSubsRes] = await Promise.all([
    subIds.length
      ? supabase.from('grades').select('submission_id, band_overall, raw_score:feedback->raw_score, total:feedback->total, created_at').in('submission_id', subIds)
      : Promise.resolve({ data: [] }),
    itemIds.length
      ? supabase.from('practice_items').select('id, type, sub_skill, payload->title').in('id', itemIds)
      : Promise.resolve({ data: [] }),
    drillIds.length
      ? supabase.from('submissions').select('practice_item_id').eq('user_id', user.id).eq('status', 'graded').in('practice_item_id', drillIds)
      : Promise.resolve({ data: [] }),
  ])

  // ── High school ───────────────────────────────────────────────────────
  const subjects = getSubjects()
  const metaBySlug = Object.fromEntries(subjects.map((s) => [s.slug, s]))
  const lessons = getAllLessons().map(toSummary)
  const lessonById = new Map(lessons.map((l) => [l.id, l]))
  const progressById = new Map(hsRows.map((r) => [r.lesson_id, r]))
  const isDone = (id) => progressById.get(id)?.passed === true

  // Lessons in course order (subject order from the registry, then catalog order).
  const bySubject = Object.fromEntries(subjects.map((s) => [s.slug, lessons.filter((l) => l.subject === s.slug)]))
  const ordered = subjects.flatMap((s) => bySubject[s.slug])

  const recentRow = hsRows
    .filter((r) => lessonById.has(r.lesson_id))
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]
  const recentSubject = recentRow ? lessonById.get(recentRow.lesson_id).subject : null
  const nextLesson =
    (recentSubject && bySubject[recentSubject]?.find((l) => !isDone(l.id))) ||
    ordered.find((l) => !isDone(l.id)) ||
    null

  let next = null
  let mode = 'start'
  if (nextLesson) {
    const inSubject = bySubject[nextLesson.subject]
    const last = progressById.get(nextLesson.id) ?? null
    next = {
      lesson: nextLesson,
      meta: metaBySlug[nextLesson.subject],
      position: inSubject.findIndex((l) => l.id === nextLesson.id) + 1,
      count: inSubject.length,
      done: inSubject.filter((l) => isDone(l.id)).length,
      href: lessonHref(nextLesson),
      last,
    }
    mode = last ? 'retry' : hsRows.length > 0 ? 'continue' : 'start'
  }

  const subjectRows = subjects.map((s) => ({ ...s, done: s.lessonIds.filter(isDone).length }))
  const hsDone = subjectRows.reduce((n, s) => n + s.done, 0)
  const hsTotal = lessons.length
  const forms = [...new Set(subjects.flatMap((s) => s.forms))].sort()
  const formsLabel = forms.length > 1 ? `${forms[0]}–${forms[forms.length - 1]}` : forms[0] ? String(forms[0]) : ''

  // ── IELTS ─────────────────────────────────────────────────────────────
  const itemById = new Map((itemsRes.data ?? []).map((it) => [it.id, it]))
  const gradeBySub = new Map()
  for (const g of gradesRes.data ?? []) {
    const prev = gradeBySub.get(g.submission_id)
    if (!prev || new Date(g.created_at) > new Date(prev.created_at)) gradeBySub.set(g.submission_id, g)
  }

  const reading = {
    done: new Set((drillSubsRes.data ?? []).map((s) => s.practice_item_id)).size,
    total: drillIds.length,
  }

  function resultHref(sub, item) {
    const section = item ? sectionForType(item.type) : null
    if (!section) return '/practice'
    return sub.status === 'graded' || sub.status === 'error'
      ? `${section.routeBase}/${item.id}/result/${sub.id}`
      : `${section.routeBase}/${item.id}`
  }

  let latest = null
  for (const s of subs) {
    const g = gradeBySub.get(s.id)
    if (!g || g.band_overall == null) continue
    if (!latest || new Date(g.created_at) > new Date(latest.at)) {
      const item = itemById.get(s.practice_item_id)
      latest = { band: g.band_overall, label: item ? labelForType(item.type) : 'IELTS practice', at: g.created_at, href: resultHref(s, item) }
    }
  }

  // ── Recent activity (both courses, newest first) ──────────────────────
  const hsActivity = hsRows
    .filter((r) => lessonById.has(r.lesson_id))
    .map((r) => {
      const lesson = lessonById.get(r.lesson_id)
      const meta = metaBySlug[lesson.subject]
      return {
        key: `hs-${r.lesson_id}`,
        kind: 'hs',
        title: lesson.title,
        course: meta.name,
        status: r.passed ? 'Passed' : 'Not passed yet',
        href: lessonHref(lesson),
        at: r.completed_at,
        score: { value: `${r.score}/${r.total}`, label: `${r.score} out of ${r.total}`, tone: r.passed ? 'passed' : 'notyet' },
      }
    })

  const ieltsActivity = subs.map((s) => {
    const item = itemById.get(s.practice_item_id)
    const g = gradeBySub.get(s.id)
    // `status` is the words on the meta line; `score` is the figure at the right.
    let status = null
    let score = null
    if (s.status === 'graded' && g?.band_overall != null) {
      const b = Number(g.band_overall).toFixed(1)
      status = 'Band score'
      score = { value: b, label: `Band ${b}`, tone: 'band' }
    } else if (s.status === 'graded' && g?.raw_score != null) {
      status = 'Answers correct'
      score = { value: `${g.raw_score}/${g.total}`, label: `${g.raw_score} out of ${g.total} correct`, tone: 'band' }
    } else if (s.status === 'pending_grade') status = s.submitted_at ? 'Marking…' : 'Not finished'
    else if (s.status === 'error') status = 'Not marked'
    return {
      key: `ielts-${s.id}`,
      kind: 'ielts',
      title: item?.title || (item ? subSkillLabel(item.sub_skill) : 'IELTS practice'),
      course: `IELTS ${item ? labelForType(item.type) : 'practice'}`,
      status,
      href: resultHref(s, item),
      at: s.submitted_at || s.started_at,
      score,
    }
  })

  const activity = [...hsActivity, ...ieltsActivity]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, ACTIVITY_LIMIT)

  // ── Render ────────────────────────────────────────────────────────────
  const firstName = (user.user_metadata?.full_name || '').trim().split(/\s+/)[0]
  const returning = hsRows.length > 0 || subs.length > 0
  const heading = firstName ? `${returning ? 'Welcome back' : 'Welcome'}, ${firstName}` : returning ? 'Welcome back' : 'Welcome'

  return (
    <>
      {user.user_metadata?.is_demo ? <DemoNotice /> : null}

      <div className="container-app stagger pb-16 pt-8 sm:pb-24 sm:pt-12">
        <header className="animate-fade-in-up">
          <h1 className="h-page">{heading}</h1>
          <p className="mt-2 text-[15px] text-ink-600 sm:text-[17px]">
            {returning ? 'Here is where you are in your courses.' : 'Pick a lesson to begin. Your progress will show up here.'}
          </p>
        </header>

        <div className="mt-6 animate-fade-in-up sm:mt-8">
          <ContinueBoard next={next} mode={mode} />
        </div>

        {/* Phones: one column in reading order. Desktop: the two courses side by
            side, the offline note under the shorter High School column, then
            recent activity across the full width. */}
        <div className="mt-12 grid animate-fade-in-up gap-x-16 gap-y-14 sm:mt-16 lg:grid-cols-2">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <HighSchoolPanel subjects={subjectRows} done={hsDone} total={hsTotal} forms={formsLabel} />
          </div>
          <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <IeltsPanel profile={profile} reading={reading} latest={latest} />
          </div>
          <div className="min-w-0 lg:col-span-2 lg:row-start-3 lg:mt-6">
            <RecentActivity items={activity} startHref={next?.href || '/learn/high-school'} />
          </div>
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <OfflineNote />
          </div>
        </div>
      </div>
    </>
  )
}
