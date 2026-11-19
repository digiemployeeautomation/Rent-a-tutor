// app/dashboard/student/page.js
//
// Student home. Serves both courses: a "Continue learning" hero for the next
// high-school lesson, a panel per course, recent activity and an offline
// nudge. Every number comes from the database or the lesson catalog.
// IELTS onboarding is optional — never forced from here.
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import { getAllLessons, getSubjects, toSummary } from '@/lib/highschool/catalog'
import { lessonHref } from '@/lib/highschool/subjects'
import { sectionForType, labelForType, subSkillLabel } from '@/lib/ielts/sections'
import DemoBanner from '@/components/dashboard/DemoBanner'
import ContinueCard from '@/components/dashboard/ContinueCard'
import HighSchoolPanel from '@/components/dashboard/HighSchoolPanel'
import IeltsPanel from '@/components/dashboard/IeltsPanel'
import RecentActivity from '@/components/dashboard/RecentActivity'
import OfflineCard from '@/components/dashboard/OfflineCard'

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
        context: `${meta.name} · ${r.passed ? 'Quiz passed' : 'Quiz not passed yet'}`,
        href: lessonHref(lesson),
        at: r.completed_at,
        icon: meta.icon,
        tile: meta.tile,
        result: { label: `${r.score}/${r.total}`, tone: r.passed ? 'green' : 'sun' },
      }
    })

  const ieltsActivity = subs.map((s) => {
    const item = itemById.get(s.practice_item_id)
    const g = gradeBySub.get(s.id)
    let result
    if (s.status === 'graded' && g?.band_overall != null) result = { label: `Band ${Number(g.band_overall).toFixed(1)}`, tone: 'teal' }
    else if (s.status === 'graded' && g?.raw_score != null) result = { label: `${g.raw_score}/${g.total} correct`, tone: 'teal' }
    else if (s.status === 'pending_grade') result = { label: s.submitted_at ? 'Marking…' : 'Not finished', tone: 'plain' }
    else if (s.status === 'error') result = { label: 'Not marked', tone: 'plain' }
    return {
      key: `ielts-${s.id}`,
      kind: 'ielts',
      title: item?.title || (item ? subSkillLabel(item.sub_skill) : 'IELTS practice'),
      context: `IELTS ${item ? labelForType(item.type) : 'practice'}`,
      href: resultHref(s, item),
      at: s.submitted_at || s.started_at,
      itemType: item?.type,
      tile: 'bg-teal-50 text-teal-700',
      result,
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
    <div className="container-app space-y-6 py-6 sm:space-y-8 sm:py-10">
      {user.user_metadata?.is_demo ? <DemoBanner /> : null}

      <header>
        <h1 className="h-page">{heading}</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          {returning ? 'Here is where you are in your courses.' : 'Pick a lesson to begin. Your progress will show up here.'}
        </p>
      </header>

      <ContinueCard next={next} mode={mode} />

      <div className="grid gap-6 lg:grid-cols-2">
        <HighSchoolPanel subjects={subjectRows} done={hsDone} total={hsTotal} forms={formsLabel} />
        <IeltsPanel profile={profile} reading={reading} latest={latest} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <RecentActivity items={activity} startHref={next?.href || '/learn/high-school'} />
        </div>
        <OfflineCard />
      </div>
    </div>
  )
}
