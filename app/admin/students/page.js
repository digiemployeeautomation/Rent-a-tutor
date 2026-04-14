// app/admin/students/page.js
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    active:    'bg-green-100 text-green-700',
    expired:   'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
    pending:   'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status ?? 'none'}
    </span>
  )
}

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  )
}

function TierBadge({ tier }) {
  const styles = {
    free:    'bg-gray-100 text-gray-600',
    basic:   'bg-blue-100 text-blue-700',
    premium: 'bg-purple-100 text-purple-700',
  }
  return tier ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[tier] ?? 'bg-gray-100 text-gray-600'}`}>
      {tier}
    </span>
  ) : <span className="text-gray-400">—</span>
}

// ── Expanded student detail ───────────────────────────────────────────────────
function StudentDetail({ userId }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function load() {
      try {
        const [quizRes, subRes] = await Promise.all([
          supabase
            .from('quiz_attempts')
            .select('score, max_score, passed')
            .eq('student_id', userId),
          supabase
            .from('subscriptions')
            .select('id, plan_type, status, price_paid, starts_at, expires_at, created_at')
            .eq('student_id', userId)
            .order('created_at', { ascending: false }),
        ])

        const attempts = quizRes.data ?? []
        const totalAttempts = attempts.length
        const avgScore = totalAttempts > 0
          ? attempts.reduce((acc, a) => acc + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0), 0) / totalAttempts
          : 0
        const passRate = totalAttempts > 0
          ? (attempts.filter(a => a.passed).length / totalAttempts) * 100
          : 0

        setDetail({
          quiz: { totalAttempts, avgScore, passRate },
          subscriptions: subRes.data ?? [],
        })
      } catch (err) {
        console.error('StudentDetail fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  if (loading) {
    return (
      <tr>
        <td colSpan={9} className="px-6 py-4 bg-gray-50">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </td>
      </tr>
    )
  }

  if (!detail) return null

  return (
    <tr>
      <td colSpan={9} className="bg-gray-50 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quiz summary */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Quiz Summary</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-center">
                <p className="text-xs text-gray-500">Attempts</p>
                <p className="text-lg font-bold text-gray-800 tabular-nums">{detail.quiz.totalAttempts}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-center">
                <p className="text-xs text-gray-500">Avg Score</p>
                <p className="text-lg font-bold text-gray-800 tabular-nums">{detail.quiz.avgScore.toFixed(1)}%</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-center">
                <p className="text-xs text-gray-500">Pass Rate</p>
                <p className="text-lg font-bold text-gray-800 tabular-nums">{detail.quiz.passRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Subscription history */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Subscription History</h4>
            {detail.subscriptions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No subscriptions</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {detail.subscriptions.map(sub => (
                  <div key={sub.id} className="bg-white rounded border border-gray-100 px-3 py-2 flex items-center justify-between text-xs">
                    <span className="font-medium capitalize text-gray-700">{sub.plan_type ?? '—'}</span>
                    <StatusBadge status={sub.status} />
                    <span className="text-gray-500 tabular-nums">
                      {sub.price_paid != null ? `$${Number(sub.price_paid).toFixed(2)}` : '—'}
                    </span>
                    <span className="text-gray-400">
                      {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formFilter, setFormFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const FORM_LEVELS = ['all', '1', '2', '3', '4', '5', '6']

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Fetch student_profiles joined with profiles for full_name
        let query = supabase
          .from('student_profiles')
          .select(`
            user_id,
            display_name,
            form_level,
            learning_tier,
            xp_total,
            current_level,
            current_streak,
            onboarding_complete,
            profiles:user_id ( full_name )
          `)
          .limit(50)

        if (search.trim()) {
          query = query.ilike('profiles.full_name', `%${search.trim()}%`)
        }
        if (formFilter !== 'all') {
          query = query.eq('form_level', formFilter)
        }

        const { data: spData, error: spError } = await query
        if (spError) throw spError

        // For each student fetch their active subscription status
        const userIds = (spData ?? []).map(s => s.user_id)
        let subsMap = {}
        if (userIds.length > 0) {
          const { data: subsData } = await supabase
            .from('subscriptions')
            .select('student_id, status')
            .in('student_id', userIds)
            .eq('status', 'active')
          for (const s of (subsData ?? [])) {
            subsMap[s.student_id] = s.status
          }
        }

        const merged = (spData ?? []).map(s => ({
          ...s,
          full_name: s.profiles?.full_name ?? null,
          subscription_status: subsMap[s.user_id] ?? null,
        }))

        setStudents(merged)
      } catch (err) {
        console.error('AdminStudentsPage fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [search, formFilter])

  // Client-side filtering fallback (ilike on joined columns may not filter in all Supabase configurations)
  const filtered = students.filter(s => {
    const name = (s.full_name ?? s.display_name ?? '').toLowerCase()
    const matchSearch = !search.trim() || name.includes(search.trim().toLowerCase())
    const matchForm = formFilter === 'all' || String(s.form_level) === formFilter
    return matchSearch && matchForm
  })

  function toggleRow(id) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Students</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and view all registered students</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={formFilter}
          onChange={e => setFormFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {FORM_LEVELS.map(f => (
            <option key={f} value={f}>{f === 'all' ? 'All Forms' : `Form ${f}`}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400 ml-auto">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Form Level</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Tier</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">XP</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Level</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Streak</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Subscription</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Onboarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                        No students found.
                      </td>
                    </tr>
                  )
                  : filtered.flatMap(s => {
                    const isExpanded = expandedId === s.user_id
                    return [
                      <tr
                        key={s.user_id}
                        onClick={() => toggleRow(s.user_id)}
                        className="hover:bg-indigo-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-400 text-xs">{isExpanded ? '▾' : '▸'}</span>
                            <span className="font-medium text-gray-800">
                              {s.full_name ?? s.display_name ?? <span className="text-gray-400 italic">Unknown</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {s.form_level ? `Form ${s.form_level}` : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3"><TierBadge tier={s.learning_tier} /></td>
                        <td className="px-4 py-3 text-center text-gray-700 tabular-nums font-medium">
                          {s.xp_total ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 tabular-nums font-medium">
                          {s.current_level ?? 1}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-orange-600 font-semibold tabular-nums text-sm">
                            🔥 {s.current_streak ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={s.subscription_status} />
                        </td>
                        <td className="px-4 py-3">
                          {s.onboarding_complete
                            ? <span className="text-green-600 text-xs font-medium">Yes</span>
                            : <span className="text-gray-400 text-xs">No</span>}
                        </td>
                      </tr>,
                      ...(isExpanded ? [<StudentDetail key={`detail-${s.user_id}`} userId={s.user_id} />] : []),
                    ]
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
