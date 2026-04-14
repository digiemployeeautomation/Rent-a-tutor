// app/dashboard/student/leaderboard/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MEDALS = ['gold', 'silver', 'bronze']

const MEDAL_STYLES = {
  gold:   { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', label: '1st' },
  silver: { bg: '#F1F5F9', border: '#94A3B8', text: '#334155', label: '2nd' },
  bronze: { bg: '#FEF0E7', border: '#C2763E', text: '#7C2D12', label: '3rd' },
}

function MedalBadge({ rank }) {
  const medal = MEDALS[rank - 1]
  if (!medal) return (
    <span className="text-sm font-medium text-gray-500 w-8 text-center">{rank}</span>
  )
  const s = MEDAL_STYLES[medal]
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold flex-shrink-0"
      style={{ backgroundColor: s.bg, border: `2px solid ${s.border}`, color: s.text }}
    >
      {rank}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      <td className="py-3 px-4 w-16">
        <div className="h-8 w-8 rounded-full bg-gray-200 mx-auto" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-40" />
      </td>
      <td className="py-3 px-4 text-right">
        <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
      </td>
      <td className="py-3 px-4 text-right">
        <div className="h-4 bg-gray-200 rounded w-12 ml-auto" />
      </td>
    </tr>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()

  const [period, setPeriod]           = useState('weekly')  // 'weekly' | 'monthly'
  const [loading, setLoading]         = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [formLevel, setFormLevel]     = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [myRank, setMyRank]           = useState(null)
  const [error, setError]             = useState(null)

  // Load current user's profile on mount
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setCurrentUserId(user.id)

      const { data: profile, error: profErr } = await supabase
        .from('student_profiles')
        .select('form_level')
        .eq('user_id', user.id)
        .single()

      if (profErr || !profile) {
        setError('Could not load your profile. Please try again.')
        setLoading(false)
        return
      }

      setFormLevel(profile.form_level)
    }
    loadProfile()
  }, [router])

  // Fetch leaderboard whenever formLevel or period changes
  useEffect(() => {
    if (!formLevel || !currentUserId) return

    async function fetchLeaderboard() {
      setLoading(true)
      setError(null)

      try {
        // v1: both weekly and monthly use total XP ordered desc, filtered by form_level
        const { data: rows, error: lbErr } = await supabase
          .from('student_profiles')
          .select('user_id, display_name, xp_total, current_level')
          .eq('form_level', formLevel)
          .order('xp_total', { ascending: false })
          .limit(50)

        if (lbErr) throw lbErr

        const students = (rows ?? []).map((s, idx) => ({
          ...s,
          rank: idx + 1,
          display_name: s.display_name || 'Anonymous',
        }))

        setLeaderboard(students)

        // Determine current user's rank
        const meInList = students.find(s => s.user_id === currentUserId)
        if (meInList) {
          setMyRank(meInList.rank)
        } else {
          // User is outside top 50 — count how many have higher XP
          const { count } = await supabase
            .from('student_profiles')
            .select('user_id', { count: 'exact', head: true })
            .eq('form_level', formLevel)
            .gt('xp_total', rows?.[rows.length - 1]?.xp_total ?? 0)
          setMyRank((count ?? 0) + 1)
        }
      } catch (err) {
        console.error('[Leaderboard] fetch error:', err)
        setError('Failed to load leaderboard. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [formLevel, currentUserId, period])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header banner */}
      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>
            {formLevel ? `${formLevel} Leaderboard` : 'Leaderboard'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-nav-text)', opacity: 0.7 }}>
            See how you rank against your classmates.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Period toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit mb-6">
          {['weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-5 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
              style={
                period === p
                  ? { backgroundColor: 'var(--color-primary-mid)', color: 'var(--color-nav-text)' }
                  : { color: 'var(--color-primary)' }
              }
            >
              {p === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>

        {/* My rank summary card */}
        {!loading && myRank !== null && !error && (
          <div
            className="rounded-2xl border px-5 py-4 mb-6 flex items-center justify-between"
            style={{ backgroundColor: 'var(--color-stat-a-bg)', borderColor: 'var(--color-primary-mid)' }}
          >
            <div>
              <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-stat-a-sub)' }}>
                Your current rank
              </div>
              <div className="font-serif text-3xl" style={{ color: 'var(--color-stat-a-text)' }}>
                #{myRank}
              </div>
            </div>
            <div className="text-xs text-gray-500 text-right">
              {period === 'weekly' ? 'This week' : 'This month'}<br />
              <span style={{ color: 'var(--color-primary-lit)' }}>{formLevel}</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Leaderboard table */}
        {!error && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200" style={{ backgroundColor: 'var(--color-surface, #f4f7f0)' }}>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 w-16">Rank</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Name</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">XP</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500">Level</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : leaderboard.length === 0
                  ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-sm text-gray-400">
                        No students yet. Be the first to earn XP!
                      </td>
                    </tr>
                  )
                  : leaderboard.map(student => {
                    const isMe      = student.user_id === currentUserId
                    const isTop3    = student.rank <= 3
                    const medalKey  = MEDALS[student.rank - 1]
                    const medalStyle = isTop3 ? MEDAL_STYLES[medalKey] : null

                    return (
                      <tr
                        key={student.user_id}
                        className="border-b border-gray-100 last:border-0 transition-colors"
                        style={
                          isMe
                            ? { backgroundColor: 'var(--color-stat-b-bg, #f0f5e6)' }
                            : isTop3
                            ? { backgroundColor: medalStyle.bg + '55' }
                            : {}
                        }
                      >
                        {/* Rank */}
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            <MedalBadge rank={student.rank} />
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar initials */}
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: isMe
                                  ? 'var(--color-primary-mid)'
                                  : 'var(--color-surface, #f4f7f0)',
                                color: isMe
                                  ? 'var(--color-nav-text)'
                                  : 'var(--color-primary)',
                              }}
                            >
                              {student.display_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-800">
                                {student.display_name}
                              </span>
                              {isMe && (
                                <span
                                  className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ backgroundColor: 'var(--color-primary-mid)', color: 'var(--color-nav-text)' }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* XP */}
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                            {(student.xp_total ?? 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">XP</span>
                        </td>

                        {/* Level */}
                        <td className="py-3 px-4 text-right">
                          <span
                            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: 'var(--color-stat-a-bg)',
                              color: 'var(--color-stat-a-text)',
                            }}
                          >
                            Lv {student.current_level ?? 1}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Footer note */}
        {!loading && !error && leaderboard.length > 0 && (
          <p className="text-xs text-center text-gray-400 mt-4">
            Showing top {leaderboard.length} student{leaderboard.length !== 1 ? 's' : ''} in {formLevel} &middot;{' '}
            Rankings based on total XP earned
          </p>
        )}

      </div>
    </>
  )
}
