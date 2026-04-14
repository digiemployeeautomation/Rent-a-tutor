// app/admin/page.js
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AnalyticsCards from '@/components/admin/AnalyticsCards'

// ── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    active:    'bg-green-100 text-green-700',
    expired:   'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
    pending:   'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ── Skeleton row helper ──────────────────────────────────────────────────────
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

// ── Recent Subscriptions ─────────────────────────────────────────────────────
function RecentSubscriptions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            id,
            plan_type,
            status,
            price_paid,
            created_at,
            profiles:student_id ( full_name )
          `)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error
        setRows(data ?? [])
      } catch (err) {
        console.error('RecentSubscriptions fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 text-base">Recent Subscriptions</h2>
        <p className="text-xs text-gray-500 mt-0.5">Last 10 subscriptions across all plans</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Student</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Plan</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Price</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : rows.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                      No subscriptions found.
                    </td>
                  </tr>
                )
                : rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {row.profiles?.full_name ?? <span className="text-gray-400 italic">Unknown</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{row.plan_type ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">
                      {row.price_paid != null
                        ? `$${Number(row.price_paid).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Content Coverage ─────────────────────────────────────────────────────────
function ContentCoverage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        // Fetch all subjects
        const { data: subjects, error: subjectsErr } = await supabase
          .from('subjects_new')
          .select('id, name')
          .order('name')

        if (subjectsErr) throw subjectsErr

        // Fetch all lessons with their topic's subject_id
        // lessons_new -> topics -> subjects_new
        // We need topic_id on lessons to join upward.
        // Fetch topics to map topic_id -> subject_id
        const { data: topics, error: topicsErr } = await supabase
          .from('topics')
          .select('id, subject_id')

        // Fetch lessons
        const { data: lessons, error: lessonsErr } = await supabase
          .from('lessons_new')
          .select('id, topic_id, status')

        if (topicsErr || lessonsErr) {
          // Fallback: if joins fail, show subjects with zeroes
          setRows((subjects ?? []).map(s => ({ name: s.name, published: 0, draft: 0, comingSoon: 0 })))
          setLoading(false)
          return
        }

        // Build topic_id -> subject_id map
        const topicMap = {}
        for (const t of (topics ?? [])) {
          topicMap[t.id] = t.subject_id
        }

        // Aggregate per subject
        const subjectMap = {}
        for (const s of (subjects ?? [])) {
          subjectMap[s.id] = { name: s.name, published: 0, draft: 0, comingSoon: 0 }
        }

        for (const lesson of (lessons ?? [])) {
          const subjectId = topicMap[lesson.topic_id]
          if (!subjectId || !subjectMap[subjectId]) continue
          const status = (lesson.status ?? '').toLowerCase()
          if (status === 'published') subjectMap[subjectId].published++
          else if (status === 'draft') subjectMap[subjectId].draft++
          else subjectMap[subjectId].comingSoon++
        }

        setRows(Object.values(subjectMap))
      } catch (err) {
        console.error('ContentCoverage fetch error:', err)
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 text-base">Content Coverage</h2>
        <p className="text-xs text-gray-500 mt-0.5">Lesson counts by subject and publication status</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Subject</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Published</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Draft</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Coming Soon</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : rows.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                      No subjects found.
                    </td>
                  </tr>
                )
                : rows.map(row => {
                  const total = row.published + row.draft + row.comingSoon
                  return (
                    <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-800 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-6 rounded-md bg-green-50 text-green-700 text-xs font-semibold tabular-nums">
                          {row.published}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-6 rounded-md bg-yellow-50 text-yellow-700 text-xs font-semibold tabular-nums">
                          {row.draft}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-6 rounded-md bg-gray-100 text-gray-500 text-xs font-semibold tabular-nums">
                          {row.comingSoon}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 font-semibold tabular-nums">{total}</td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Analytics cards */}
      <AnalyticsCards />

      {/* Tables */}
      <RecentSubscriptions />
      <ContentCoverage />
    </div>
  )
}
