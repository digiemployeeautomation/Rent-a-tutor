// app/admin/subscriptions/page.js
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
      {status ?? '—'}
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

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Duration in days per billing type (used when reactivating)
const PLAN_DURATIONS = {
  monthly:   30,
  termly:    90,
  annual:    365,
  term:      90,
  month:     30,
  year:      365,
}

function extendDate(billingType) {
  const days = PLAN_DURATIONS[billingType?.toLowerCase()] ?? 30
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// ── Main page ─────────────────────────────────────────────────────────────────
const STATUS_TABS = ['all', 'active', 'expired', 'cancelled', 'pending']

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState({}) // id -> bool

  async function load() {
    setLoading(true)
    try {
      let query = supabase
        .from('subscriptions')
        .select(`
          id,
          student_id,
          plan_type,
          billing_type,
          status,
          price_paid,
          starts_at,
          expires_at,
          created_at,
          subject_id,
          form_id,
          term_id,
          profiles:student_id ( full_name ),
          subjects_new:subject_id ( name ),
          forms:form_id ( name, level ),
          terms:term_id ( name, number )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      setSubscriptions(data ?? [])
    } catch (err) {
      console.error('AdminSubscriptionsPage fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  async function handleCancel(sub) {
    setActionLoading(prev => ({ ...prev, [sub.id]: true }))
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', sub.id)
      if (error) throw error
      setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'cancelled' } : s))
    } catch (err) {
      console.error('Cancel error:', err)
      alert('Failed to cancel subscription.')
    } finally {
      setActionLoading(prev => ({ ...prev, [sub.id]: false }))
    }
  }

  async function handleActivate(sub) {
    setActionLoading(prev => ({ ...prev, [sub.id]: true }))
    const newExpiry = extendDate(sub.billing_type)
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active', expires_at: newExpiry })
        .eq('id', sub.id)
      if (error) throw error
      setSubscriptions(prev =>
        prev.map(s => s.id === sub.id ? { ...s, status: 'active', expires_at: newExpiry } : s)
      )
    } catch (err) {
      console.error('Activate error:', err)
      alert('Failed to activate subscription.')
    } finally {
      setActionLoading(prev => ({ ...prev, [sub.id]: false }))
    }
  }

  // Count per tab
  function tabCount(tab) {
    if (tab === 'all') return subscriptions.length
    return subscriptions.filter(s => s.status === tab).length
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all student subscriptions</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              statusFilter === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {!loading && (
              <span className="ml-1.5 text-xs text-gray-400">
                ({tab === 'all'
                  ? subscriptions.length
                  : subscriptions.filter(s => s.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Plan</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Subject / Form / Term</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Billing</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Price</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Expires</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Created</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
                : subscriptions.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">
                        No subscriptions found.
                      </td>
                    </tr>
                  )
                  : subscriptions.map(sub => {
                    const subjectName = sub.subjects_new?.name ?? null
                    const formName = sub.forms?.name ?? (sub.forms?.level ? `Form ${sub.forms.level}` : null)
                    const termName = sub.terms?.name ?? (sub.terms?.number ? `Term ${sub.terms.number}` : null)
                    const details = [subjectName, formName, termName].filter(Boolean).join(' / ')
                    const isBusy = !!actionLoading[sub.id]

                    return (
                      <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {sub.profiles?.full_name ?? <span className="text-gray-400 italic">Unknown</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">
                          {sub.plan_type ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {details || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">
                          {sub.billing_type ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                          {sub.price_paid != null ? `$${Number(sub.price_paid).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 tabular-nums">
                          {fmt(sub.expires_at)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 tabular-nums">
                          {fmt(sub.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {sub.status === 'active' ? (
                            <button
                              disabled={isBusy}
                              onClick={() => handleCancel(sub)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors disabled:opacity-50"
                            >
                              {isBusy ? 'Cancelling…' : 'Cancel'}
                            </button>
                          ) : (
                            <button
                              disabled={isBusy}
                              onClick={() => handleActivate(sub)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors disabled:opacity-50"
                            >
                              {isBusy ? 'Activating…' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && subscriptions.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-right">
            Showing {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' ? ` (${statusFilter})` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
