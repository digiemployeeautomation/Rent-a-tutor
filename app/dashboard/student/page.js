'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLevelForXP, getXPForNextLevel, LEVELS } from '@/lib/xp'
import FeedLayout from '@/components/layout/FeedLayout'
import ContinueLearningCard from '@/components/feed/ContinueLearningCard'
import StreakCard from '@/components/feed/StreakCard'
import XPSummaryCard from '@/components/feed/XPSummaryCard'
import SubjectProgressCard from '@/components/feed/SubjectProgressCard'
import QuizResultCard from '@/components/feed/QuizResultCard'
import LeaderboardSnippetCard from '@/components/feed/LeaderboardSnippetCard'
import NudgeCard from '@/components/feed/NudgeCard'
import AchievementCard from '@/components/feed/AchievementCard'

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
  const [inProgressLesson, setInProgressLesson] = useState(null) // { title, subjectName, progress, href }
  const [recentQuizzes, setRecentQuizzes] = useState([])   // last 2-3 quiz attempts with names

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

        let totalLessons = 0
        let completedLessons = 0

        try {
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

      // Recent quiz results for QuizResultCards (last 3)
      const recentQuizResults = (quizAttempts ?? []).slice(0, 3).map((q, i) => ({
        quizName: `Quiz ${i + 1}`,
        score: q.score,
        maxScore: q.max_score,
        passed: q.passed,
        href: `/dashboard/student/quiz/${q.quiz_id}`,
      }))
      setRecentQuizzes(recentQuizResults)

      // In-progress lesson — most recent incomplete lesson
      const recentProgress = (progressRows ?? [])
      if (recentProgress.length > 0 && subjectResults.length > 0) {
        const lastProgress = recentProgress[0]
        const firstSubject = subjectResults[0]
        if (firstSubject) {
          setInProgressLesson({
            lessonTitle: 'Continue where you left off',
            subjectName: firstSubject.name,
            progress: firstSubject.percentComplete,
            href: `/learn/${firstSubject.slug}`,
          })
        }
      }

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
  const firstName    = profile?.display_name?.split(' ')[0] ?? 'there'
  const xpTotal      = profile?.xp_total ?? 0
  const currentLevel = profile?.current_level ?? getLevelForXP(xpTotal)
  const streak       = profile?.current_streak ?? 0

  // XP progress toward next level
  const levelStartXP   = LEVELS ? (LEVELS[currentLevel - 1] ?? 0) : 0
  const levelEndXP     = LEVELS ? (LEVELS[currentLevel] ?? xpTotal) : xpTotal
  const levelRange     = levelEndXP - levelStartXP
  const xpIntoLevel    = xpTotal - levelStartXP
  const xpProgressPct  = levelRange > 0 ? Math.min(100, Math.round((xpIntoLevel / levelRange) * 100)) : 100
  const xpToNext       = getXPForNextLevel ? (getXPForNextLevel(xpTotal) ?? 0) : 0

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
          <Link href="/dashboard/student/onboarding" className="underline text-blue-500">
            Complete onboarding
          </Link>
        </div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────
  return (
    <>
      {/* ── Top banner ── */}
      <div className="bg-blue-600 px-4 sm:px-6 py-5">
        <div className="max-w-xl mx-auto flex flex-wrap justify-between items-start gap-3">
          <div>
            <h1 className="font-serif text-2xl text-white">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm mt-0.5 text-blue-200">
              Keep up the momentum — every lesson counts.
            </p>
          </div>
          <Link
            href="/learn"
            className="text-sm px-5 py-2.5 rounded-xl font-medium bg-pink-500 text-white hover:bg-pink-600 transition-colors self-start flex-shrink-0"
          >
            Browse lessons →
          </Link>
        </div>
      </div>

      <FeedLayout>
        <div className="stagger-children space-y-4 pt-6">

          {/* 1. Continue Learning Card */}
          {inProgressLesson && (
            <ContinueLearningCard
              lessonTitle={inProgressLesson.lessonTitle}
              subjectName={inProgressLesson.subjectName}
              progress={inProgressLesson.progress}
              href={inProgressLesson.href}
            />
          )}

          {/* 2. Streak + XP in 2-col grid */}
          <div className="grid grid-cols-2 gap-4">
            <StreakCard days={streak} />
            <XPSummaryCard
              xpToday={0}
              level={currentLevel}
              xpToNextLevel={xpToNext}
              xpProgress={xpProgressPct}
            />
          </div>

          {/* 3. Subject progress in 2-col grid */}
          {subjects.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">Subject progress</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {subjects.map((subject, i) => (
                  <SubjectProgressCard
                    key={subject.slug}
                    name={subject.name}
                    percentComplete={subject.percentComplete}
                    href={`/learn/${subject.slug}`}
                    delay={i * 50}
                  />
                ))}
              </div>
            </>
          )}

          {/* 4. Recent quiz results */}
          {recentQuizzes.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">Recent quizzes</h2>
              <div className="space-y-3">
                {recentQuizzes.map((quiz, i) => (
                  <QuizResultCard
                    key={i}
                    quizName={quiz.quizName}
                    score={quiz.score}
                    maxScore={quiz.maxScore}
                    passed={quiz.passed}
                    href={quiz.href}
                    delay={i * 50}
                  />
                ))}
              </div>
            </>
          )}

          {/* 5. Leaderboard snippet */}
          {leaderboard.length > 0 && (
            <LeaderboardSnippetCard
              rank={currentRank}
              topThree={leaderboard.slice(0, 3)}
              delay={100}
            />
          )}

          {/* Recent achievements */}
          {achievements.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">Recent achievements</h2>
              <div className="space-y-3">
                {achievements.map((a, i) => {
                  const ach = a.achievements
                  if (!ach) return null
                  return (
                    <AchievementCard
                      key={i}
                      name={ach.name}
                      description={ach.description}
                      icon={ach.icon}
                      delay={i * 50}
                    />
                  )
                })}
              </div>
            </>
          )}

          {/* 6. Nudge card (if onboarding incomplete) */}
          {showNudge && (
            <NudgeCard onDismiss={() => setShowNudge(false)} delay={150} />
          )}

        </div>
      </FeedLayout>
    </>
  )
}
