// app/dashboard/student/page.js
//
// IELTS dashboard. Three sections: profile summary, today's task CTA,
// recent submissions. All data comes from the IELTS tables; nothing
// from the legacy schools schema.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'
import FeedLayout from '@/components/layout/FeedLayout'

const SECTION_LABEL = {
  listening: 'Listening',
  reading:   'Reading',
  writing:   'Writing',
  speaking:  'Speaking',
}

const SUB_SKILL_LABELS = {
  'listening':                'Listening',
  'reading':                  'Reading',
  'writing-task-1-academic':  'Writing Task 1 (Academic)',
  'writing-task-1-general':   'Writing Task 1 (General)',
  'writing-task-2':           'Writing Task 2',
  'speaking-part-1':          'Speaking Part 1',
  'speaking-part-2':          'Speaking Part 2',
  'speaking-part-3':          'Speaking Part 3',
}

export default async function StudentDashboardPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?next=/dashboard/student')
  }

  // Profile from the IELTS onboarding questionnaire
  const { data: profile } = await supabase
    .from('user_ielts_profile')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/onboarding')
  }

  // Featured writing task (seeded). Fall back to most-recent published writing item.
  const { data: featured } = await supabase
    .from('practice_items')
    .select('id, sub_skill, payload')
    .eq('type', 'writing_task')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Recent submissions for this user — pull the latest grade for each
  const { data: recentSubs } = await supabase
    .from('submissions')
    .select('id, practice_item_id, submitted_at, status')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(5)

  const submissionIds = (recentSubs ?? []).map((s) => s.id)
  const itemIds = (recentSubs ?? []).map((s) => s.practice_item_id)

  const [{ data: gradeRows }, { data: itemRows }] = await Promise.all([
    submissionIds.length
      ? supabase
          .from('grades')
          .select('submission_id, band_overall, model_version, created_at')
          .in('submission_id', submissionIds)
      : Promise.resolve({ data: [] }),
    itemIds.length
      ? supabase
          .from('practice_items')
          .select('id, type, sub_skill, payload')
          .in('id', itemIds)
      : Promise.resolve({ data: [] }),
  ])

  const gradeBySubmissionId = new Map()
  ;(gradeRows ?? []).forEach((g) => {
    const existing = gradeBySubmissionId.get(g.submission_id)
    if (!existing || new Date(g.created_at) > new Date(existing.created_at)) {
      gradeBySubmissionId.set(g.submission_id, g)
    }
  })

  const itemById = new Map((itemRows ?? []).map((it) => [it.id, it]))

  const greetingName =
    user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'

  const daysUntilTest = profile.test_date
    ? Math.max(0, Math.ceil((new Date(profile.test_date).getTime() - Date.now()) / 86_400_000))
    : null

  return (
    <FeedLayout className="pt-6 sm:pt-10">
      <header className="mb-6">
        <p className="text-sm text-gray-500">Hi {greetingName} 👋</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-800">Your IELTS plan</h1>
      </header>

      {/* Profile summary */}
      <section className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-7 text-white shadow-sm">
        <div className="text-xs uppercase tracking-wider text-blue-200">Target band</div>
        <div className="mt-1 flex items-end gap-2">
          <div className="text-5xl font-bold">{Number(profile.target_band).toFixed(1)}</div>
          <div className="pb-2 text-sm text-blue-100">
            {profile.variant === 'general' ? 'General Training' : 'Academic'}
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-blue-200">Test date</dt>
            <dd className="font-medium">
              {profile.test_date
                ? `${profile.test_date} (${daysUntilTest}d)`
                : 'Not booked'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-blue-200">Hours / week</dt>
            <dd className="font-medium">{profile.hours_per_week}h</dd>
          </div>
          <div>
            <dt className="text-xs text-blue-200">Current band</dt>
            <dd className="font-medium">
              {profile.current_band_self != null
                ? Number(profile.current_band_self).toFixed(1)
                : 'Not measured yet'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-blue-200">Weakest</dt>
            <dd className="font-medium">{profile.weakest_section ? SECTION_LABEL[profile.weakest_section] : '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Today's task CTA */}
      {featured ? (
        <section className="mt-6 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-500">
            <span>Today</span>
            <span>•</span>
            <span>{SUB_SKILL_LABELS[featured.sub_skill] || featured.sub_skill}</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-gray-800">{featured.payload?.title ?? 'Writing task'}</h2>
          {featured.payload?.prompt ? (
            <p className="mt-2 line-clamp-3 text-sm text-gray-500">{featured.payload.prompt}</p>
          ) : null}
          <Link
            href={`/practice/writing/${featured.id}`}
            className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Start writing →
          </Link>
        </section>
      ) : (
        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 text-gray-500">
          No practice items available yet. Check back soon.
        </section>
      )}

      {/* Recent submissions */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Recent submissions</h2>
        {recentSubs && recentSubs.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {recentSubs.map((s) => {
              const item = itemById.get(s.practice_item_id)
              const grade = gradeBySubmissionId.get(s.id)
              const itemTitle = item?.payload?.title || SUB_SKILL_LABELS[item?.sub_skill] || 'Submission'
              const href = item?.type === 'writing_task'
                ? `/practice/writing/${item.id}/result/${s.id}`
                : null
              const row = (
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{itemTitle}</div>
                    <div className="text-xs text-gray-400">
                      {s.status === 'graded' ? 'Graded' : s.status === 'error' ? 'Grading failed' : 'Grading…'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-700">
                      {grade?.band_overall != null ? Number(grade.band_overall).toFixed(1) : '—'}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-gray-400">band</div>
                  </div>
                </div>
              )
              return (
                <li key={s.id}>
                  {href ? <Link href={href} className="block hover:opacity-80">{row}</Link> : row}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            You have not submitted any practice yet.
          </div>
        )}
      </section>

      <div className="mt-8 flex justify-center">
        <Link href="/practice" className="text-sm font-medium text-blue-600 hover:underline">
          Browse all practice →
        </Link>
      </div>
    </FeedLayout>
  )
}
