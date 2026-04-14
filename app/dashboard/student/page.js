'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLevelForXP } from '@/lib/xp'
import ProgressRings from '@/components/dashboard/ProgressRings'
import StreakCounter from '@/components/dashboard/StreakCounter'
import XPBar from '@/components/dashboard/XPBar'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import LeaderboardPreview from '@/components/dashboard/LeaderboardPreview'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function XP_REWARD_FOR_TYPE(type) {
  if (type === 'quiz') return 25
  if (type === 'lesson') return 10
  return 0
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function StudentDashboard() {
  const router = useRouter()

  const [loading, setLoading]             = useState(true)
  const [profile, setProfile]             = useState(null)
  const [subjects, setSubjects]           = useState([])   // { name, slug, percentComplete }
  const [activities, setActivities]       = useState([])   // { type, description, timestamp, xp }
  const [leaderboard, setLeaderboard]     = useState([])   // top 5
  const [currentRank, setCurrentRank]     = useState(null)
  const [achievements, setAchievements]   = useState([])   // recent earned achievements
  const [showNudge, setShowNudge]         = useState(false)

  useEffect(() => {
    async function load() {
      // 1. Auth check
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      // 2. Student profile
      const { data: prof } = await supabase
        .from('student_profiles')
        .select('user_id, display_name, learning_tier, xp_total, current_level, current_streak, onboarding_complete, interested_subjects, form_level')
        .eq('user_id', user.id)
        .single()

      if (!prof) { setLoading(false); return }
      setProfile(prof)
      if (!prof.onboarding_complete) setShowNudge(true)

      // 3. Active subscriptions
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('subject_id, form_id, term_id, status')
        .eq('student_id', user.id)
        .eq('status', 'active')

      const activeSubs = subs ?? []

      // 4. Subject names
      const subjectIds = [...new Set(activeSubs.map(s => s.subject_id).filter(Boolean))]
      let subjectMap = {}
      if (subjectIds.length) {
        const { data: subjectRows } = await supabase
          .from('subjects_new')
          .select('id, name, slug')
          .in('id', subjectIds)
        ;(subjectRows ?? []).forEach(s => { subjectMap[s.id] = s })
      }

      // 5. Completion percentages — best-effort per subscription
      const subjectProgressPromises = activeSubs.map(async (sub) => {
        const subjectInfo = subjectMap[sub.subject_id]
        if (!subjectInfo) return null

        // Count total lessons for this subject+form+term via units → topics → lessons_new
        // We join through the hierarchy. If any table is missing, fall back gracefully.
        let totalLessons = 0
        let completedLessons = 0

        try {
          // Get all lessons_new for subject+form+term (via units → topics)
          const { data: units } = await supabase
            .from('units')
            .select('id')
            .eq('subject_id', sub.subject_id)
            .eq('form_id', sub.form_id)
            .eq('term_id', sub.term_id)

          const unitIds = (units ?? []).map(u => u.id)

          if (unitIds.length) {
            const { data: topics } = await supabase
              .from('topics')
              .select('id')
              .in('unit_id', unitIds)

            const topicIds = (topics ?? []).map(t => t.id)

            if (topicIds.length) {
              const { count: lessonCount } = await supabase
                .from('lessons_new')
                .select('id', { count: 'exact', head: true })
                .in('topic_id', topicIds)
                .eq('published', true)

              totalLessons = lessonCount ?? 0

              // Count completed lessons for this student
              if (totalLessons > 0) {
                const { data: lessonRows } = await supabase
                  .from('lessons_new')
                  .select('id')
                  .in('topic_id', topicIds)
                  .eq('published', true)

                const lessonIds = (lessonRows ?? []).map(l => l.id)

                if (lessonIds.length) {
                  const { count: doneCount } = await supabase
                    .from('student_progress')
                    .select('lesson_id', { count: 'exact', head: true })
                    .eq('student_id', user.id)
                    .in('lesson_id', lessonIds)

                  completedLessons = doneCount ?? 0
                }
              }
            }
          }
        } catch (_e) {
          // silently skip — progress stays 0
        }

        const percentComplete = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0

        return {
          name: subjectInfo.name,
          slug: subjectInfo.slug,
          percentComplete,
        }
      })

      const subjectResults = (await Promise.all(subjectProgressPromises)).filter(Boolean)
      setSubjects(subjectResults)

      // 6. Recent activity — merge quiz_attempts + student_progress, sort by date, take 10
      const [{ data: quizAttempts }, { data: progressRows }] = await Promise.all([
        supabase
          .from('quiz_attempts')
          .select('quiz_id, score, max_score, passed, completed_at')
          .eq('student_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(10),

        supabase
          .from('student_progress')
          .select('lesson_id, section_id, completed_at')
          .eq('student_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(10),
      ])

      const quizActivities = (quizAttempts ?? []).map(q => ({
        type: 'quiz',
        description: q.passed
          ? `Passed a quiz with ${q.score}/${q.max_score}`
          : `Attempted a quiz — ${q.score}/${q.max_score}`,
        timestamp: q.completed_at,
        xp: q.passed ? XP_REWARD_FOR_TYPE('quiz') : 0,
      }))

      const lessonActivities = (progressRows ?? []).map(p => ({
        type: 'lesson',
        description: 'Completed a lesson section',
        timestamp: p.completed_at,
        xp: XP_REWARD_FOR_TYPE('lesson'),
      }))

      const allActivities = [...quizActivities, ...lessonActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)

      setActivities(allActivities)

      // 7. Leaderboard — top 5 students with same form_level + current user rank
      if (prof.form_level) {
        const { data: topStudents } = await supabase
          .from('student_profiles')
          .select('user_id, display_name, xp_total, current_level')
          .eq('form_level', prof.form_level)
          .order('xp_total', { ascending: false })
          .limit(5)

        const board = (topStudents ?? []).map((s, i) => ({
          rank: i + 1,
          displayName: s.display_name ?? 'Student',
          xpTotal: s.xp_total ?? 0,
          level: s.current_level ?? getLevelForXP(s.xp_total ?? 0),
        }))
        setLeaderboard(board)

        // Find current user's rank
        const { count: rankCount } = await supabase
          .from('student_profiles')
          .select('user_id', { count: 'exact', head: true })
          .eq('form_level', prof.form_level)
          .gt('xp_total', prof.xp_total ?? 0)

        setCurrentRank((rankCount ?? 0) + 1)
      }

      // 8. Recent achievements
      const { data: earnedAchievements } = await supabase
        .from('student_achievements')
        .select('earned_at, achievements(id, name, description, icon)')
        .eq('student_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(3)

      setAchievements(earnedAchievements ?? [])

      setLoading(false)
    }

    load()
  }, [router])

  // ─── Derived values ────────────────────────
  const firstName   = profile?.display_name?.split(' ')[0] ?? 'there'
  const xpTotal     = profile?.xp_total ?? 0
  const currentLevel = profile?.current_level ?? getLevelForXP(xpTotal)
  const streak      = profile?.current_streak ?? 0

  // ─── Loading state ─────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Loading your dashboard...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">
          Profile not found.{' '}
          <Link href="/dashboard/student/onboarding" className="underline text-forest-500">
            Complete onboarding
          </Link>
        </div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────
  return (
    <>
      {/* ── Onboarding nudge banner ── */}
      {showNudge && (
        <div className="bg-gold-100 border-b border-gold-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-gold-600">
              Finish setting up your profile to get personalised subject recommendations.
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/dashboard/student/onboarding"
                className="text-xs px-4 py-2 rounded-lg font-medium bg-gold-300 text-white hover:bg-gold-400 transition-colors"
              >
                Complete profile
              </Link>
              <button
                onClick={() => setShowNudge(false)}
                className="text-xs text-gold-500 hover:text-gold-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top banner ── */}
      <div className="bg-forest-600 px-4 sm:px-6 py-5">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-start gap-3">
          <div>
            <h1 className="font-serif text-2xl text-white">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm mt-0.5 text-forest-200">
              Keep up the momentum — every lesson counts.
            </p>
          </div>
          <Link
            href="/learn"
            className="text-sm px-5 py-2.5 rounded-lg font-medium bg-gold-300 text-white hover:bg-gold-400 transition-colors self-start flex-shrink-0"
          >
            Continue learning →
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Streak + XP row ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 p-4 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <StreakCounter days={streak} />
            <span className="text-xs text-gray-400 hidden sm:block">streak</span>
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block flex-shrink-0" />
          <div className="flex-1 w-full">
            <XPBar xpTotal={xpTotal} currentLevel={currentLevel} />
          </div>
        </div>

        {/* ── Subject progress rings ── */}
        {subjects.length > 0 && (
          <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-serif text-lg text-forest-700 mb-4">Subject progress</h2>
            <ProgressRings subjects={subjects} />
          </div>
        )}

        {/* ── Bottom 2-col section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — Activity Feed */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-serif text-lg text-forest-700 mb-4">Recent activity</h2>
            <ActivityFeed activities={activities} />
          </div>

          {/* Right — Leaderboard + Achievements */}
          <div className="flex flex-col gap-6">

            {/* Leaderboard */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-serif text-lg text-forest-700 mb-4">Leaderboard</h2>
              <LeaderboardPreview leaderboard={leaderboard} currentRank={currentRank} />
            </div>

            {/* Recent achievements */}
            {achievements.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="font-serif text-lg text-forest-700 mb-4">Recent achievements</h2>
                <div className="space-y-3">
                  {achievements.map((a, i) => {
                    const ach = a.achievements
                    if (!ach) return null
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-base flex-shrink-0">
                          {ach.icon ?? '🏆'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{ach.name}</p>
                          <p className="text-xs text-gray-400">{ach.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
