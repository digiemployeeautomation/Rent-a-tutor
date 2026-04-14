// app/dashboard/student/leaderboard/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import FeedLayout from '@/components/layout/FeedLayout'

const MEDALS = ['gold', 'silver', 'bronze']

const MEDAL_STYLES = {
  gold:   { bg: '#FFD700', border: '#B8860B', text: '#7C5200', rowBg: '#FFFBEB' },
  silver: { bg: '#C0C0C0', border: '#888888', text: '#374151', rowBg: '#F8FAFC' },
  bronze: { bg: '#CD7F32', border: '#8B5E1A', text: '#FFFFFF', rowBg: '#FFF7ED' },
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

function PeriodToggle({ period, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit">
      {['weekly', 'monthly'].map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
            period === p
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {p === 'weekly' ? 'Weekly' : 'Monthly'}
        </button>
      ))}
    </div>
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
    <FeedLayout>
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {formLevel ? `${formLevel} Leaderboard` : 'Leaderboard'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          See how you rank against your classmates.
        </p>
      </div>

      {/* Period toggle */}
      <div className="mb-6">
        <PeriodToggle period={period} onChange={setPeriod} />
      </div>

      {/* My rank summary card */}
      {!loading && myRank !== null && !error && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-blue-500 mb-0.5">
              Your current rank
            </div>
            <div className="font-bold text-3xl text-blue-700">
              #{myRank}
            </div>
          </div>
          <div className="text-xs text-gray-500 text-right">
            {period === 'weekly' ? 'This week' : 'This month'}<br />
            <span className="text-blue-600 font-medium">{formLevel}</span>
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
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
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
                          ? { backgroundColor: '#FDF2F8' } // pink-50
                          : isTop3
                          ? { backgroundColor: medalStyle.rowBg }
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
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                              isMe
                                ? 'bg-pink-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {student.display_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-800">
                              {student.display_name}
                            </span>
                            {isMe && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-pink-100 text-pink-500">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* XP */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-semibold text-blue-600">
                          {(student.xp_total ?? 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">XP</span>
                      </td>

                      {/* Level */}
                      <td className="py-3 px-4 text-right">
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
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

    </FeedLayout>
  )
}
