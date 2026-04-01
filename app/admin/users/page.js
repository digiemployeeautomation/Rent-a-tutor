'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminUsersInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'pending' ? 'pending'
    : searchParams.get('role') === 'tutor' ? 'tutors'
    : searchParams.get('role') === 'student' ? 'students'
    : 'tutors'

  const [tab, setTab]         = useState(initialTab)
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    if (tab === 'tutors' || tab === 'pending') {
      const query = supabase
        .from('tutors')
        .select('id, is_approved, is_featured, badge, subjects, hourly_rate_kwacha, avg_rating, total_reviews, created_at, profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false })

      if (tab === 'pending') query.eq('is_approved', false)
      else query.eq('is_approved', true)

      const { data: rows } = await query
      setData(rows ?? [])
    } else {
      const { data: rows } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
      setData(rows ?? [])
    }
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  async function toggleApproval(id, current) {
    await supabase.from('tutors').update({ is_approved: !current }).eq('id', id)
    setData(prev => prev.map(r => r.id === id ? { ...r, is_approved: !current } : r))
  }

  async function toggleFeatured(id, current) {
    await supabase.from('tutors').update({ is_featured: !current }).eq('id', id)
    setData(prev => prev.map(r => r.id === id ? { ...r, is_featured: !current } : r))
  }

  const filtered = data.filter(r => {
    if (!search.trim()) return true
    const name = (r.profiles?.full_name ?? r.full_name ?? '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <nav className="text-xs mb-1 opacity-60" style={{ color: 'var(--color-nav-text)' }}>
              <Link href="/admin" className="hover:opacity-100">Admin</Link> / Users
            </nav>
            <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>Users</h1>
          </div>
          <Link href="/admin" className="text-xs px-4 py-2 rounded-lg border"
            style={{ color: 'var(--color-nav-text)', borderColor: 'rgba(255,255,255,0.25)' }}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 w-fit">
            {[
              { key: 'tutors',   label: 'Approved tutors' },
              { key: 'pending',  label: 'Pending'         },
              { key: 'students', label: 'Students'        },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="text-sm px-4 py-1.5 rounded-lg transition"
                style={tab === t.key
                  ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-nav-text)', fontWeight: 500 }
                  : { color: '#6b7280' }}>
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-gray-300 bg-white"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-16 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm text-gray-400">No users found.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {filtered.map((row, i) => {
              const name     = row.profiles?.full_name ?? row.full_name ?? 'Unknown'
              const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              const isTutor  = tab !== 'students'

              return (
                <div key={row.id}
                  className={`flex items-center justify-between px-5 py-4 gap-4 ${i < filtered.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800">{name}</div>
                      {isTutor ? (
                        <div className="text-xs text-gray-400 truncate">
                          {(row.subjects ?? []).slice(0, 2).join(', ')}
                          {row.avg_rating ? ` · ★ ${row.avg_rating.toFixed(1)}` : ''}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">Student</div>
                      )}
                    </div>
                  </div>

                  {isTutor && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleFeatured(row.id, row.is_featured)}
                        className="text-xs px-3 py-1.5 rounded-lg border transition"
                        style={row.is_featured
                          ? { backgroundColor: 'var(--color-highlight)', borderColor: 'var(--color-accent-mid)', color: 'var(--color-accent)' }
                          : { borderColor: '#e5e7eb', color: '#9ca3af' }}>
                        {row.is_featured ? '★ Featured' : 'Feature'}
                      </button>
                      {tab === 'pending' && (
                        <button onClick={() => toggleApproval(row.id, false)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                          Approve
                        </button>
                      )}
                      {tab === 'tutors' && (
                        <button onClick={() => toggleApproval(row.id, true)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                          Revoke
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <AdminUsersInner />
    </Suspense>
  )
}
