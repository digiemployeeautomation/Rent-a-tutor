'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const STATUS_STYLES = {
  pending:   { bg: 'var(--color-stat-b-bg)',  text: 'var(--color-stat-b-sub)'  },
  confirmed: { bg: 'var(--color-stat-a-bg)',  text: 'var(--color-badge-text)'  },
  completed: { bg: 'var(--color-stat-a-bg)',  text: 'var(--color-badge-text)'  },
  cancelled: { bg: '#f3f4f6',                 text: '#9ca3af'                  },
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleDateString('en-ZM', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function TutorSessionsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]  = useState(true)
  const [tab, setTab]          = useState('upcoming')
  const [userId, setUserId]    = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')
      setUserId(user.id)

      const { data, error } = await supabase
        .from('bookings')
        .select('id, subject, scheduled_at, status, amount, notes, profiles!student_id(full_name, avatar_url)')
        .eq('tutor_id', user.id)
        .order('scheduled_at', { ascending: false })

      if (error) console.error('[sessions] load error:', error)
      setBookings(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function updateStatus(id, status) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id).eq('tutor_id', userId)
    if (error) { console.error('[sessions] update error:', error); return }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  const now = new Date()
  const upcoming = bookings.filter(b =>
    ['pending', 'confirmed'].includes(b.status) && new Date(b.scheduled_at) >= now
  )
  const past = bookings.filter(b =>
    b.status === 'completed' || b.status === 'cancelled' ||
    (['confirmed', 'pending'].includes(b.status) && new Date(b.scheduled_at) < now)
  )
  const shown = tab === 'upcoming' ? upcoming : past

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-gray-400">Loading sessions...</div>
    </div>
  )

  return (
    <>
      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <nav className="text-xs mb-2 opacity-60" style={{ color: 'var(--color-nav-text)' }}>
            <Link href="/dashboard/tutor" className="hover:opacity-100">Dashboard</Link>
            {' / '}Sessions
          </nav>
          <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>Sessions</h1>
          <p className="text-sm mt-0.5 opacity-70" style={{ color: 'var(--color-nav-text)' }}>
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit gap-1">
          {[
            { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
            { key: 'past',     label: `Past (${past.length})`         },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="text-sm px-5 py-2 rounded-lg transition font-medium"
              style={tab === t.key
                ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-nav-text)' }
                : { color: '#6b7280' }}>
              {t.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm text-gray-400">
              {tab === 'upcoming' ? 'No upcoming sessions.' : 'No past sessions yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map(b => {
              const studentName = b.profiles?.full_name ?? 'Student'
              const initials    = studentName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
              const styles      = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending
              const isPast      = new Date(b.scheduled_at) < now

              return (
                <div key={b.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{studentName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{b.subject}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(b.scheduled_at)}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs px-3 py-1 rounded-full font-medium capitalize"
                        style={{ backgroundColor: styles.bg, color: styles.text }}>
                        {b.status}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-primary-lit)' }}>
                        K{b.amount}
                      </span>
                    </div>
                  </div>

                  {b.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 italic">"{b.notes}"</p>
                    </div>
                  )}

                  {b.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <button onClick={() => updateStatus(b.id, 'confirmed')}
                        className="text-xs px-4 py-1.5 rounded-lg font-medium"
                        style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                        Accept
                      </button>
                      <button onClick={() => updateStatus(b.id, 'cancelled')}
                        className="text-xs px-4 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                        Decline
                      </button>
                    </div>
                  )}

                  {b.status === 'confirmed' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <button onClick={() => updateStatus(b.id, 'completed')}
                        className="text-xs px-4 py-1.5 rounded-lg font-medium"
                        style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                        Mark as completed
                      </button>
                      <button onClick={() => updateStatus(b.id, 'cancelled')}
                        className="text-xs px-4 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
