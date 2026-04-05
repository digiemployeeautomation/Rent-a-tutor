'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TutorLessonsPage() {
  const router = useRouter()
  const [lessons, setLessons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all') // all | active | draft

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const { data } = await supabase
        .from('lessons')
        .select('id, title, subject, form_level, price, status, purchase_count, duration_seconds, created_at')
        .eq('tutor_id', user.id)
        .order('created_at', { ascending: false })

      setLessons(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  const shown = filter === 'all' ? lessons : lessons.filter(l => l.status === filter)

  const counts = {
    all:    lessons.length,
    active: lessons.filter(l => l.status === 'active').length,
    draft:  lessons.filter(l => l.status === 'draft').length,
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-gray-400">Loading lessons...</div>
    </div>
  )

  return (
    <>
      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <nav className="text-xs mb-2 opacity-60" style={{ color: 'var(--color-nav-text)' }}>
              <Link href="/dashboard/tutor" className="hover:opacity-100">Dashboard</Link>
              {' / '}My Lessons
            </nav>
            <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>My Lessons</h1>
            <p className="text-sm mt-0.5 opacity-70" style={{ color: 'var(--color-nav-text)' }}>
              {counts.active} live · {counts.draft} draft
            </p>
          </div>
          <Link href="/dashboard/tutor/upload"
            className="text-sm px-5 py-2.5 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}>
            + Upload lesson
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Filter tabs */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit gap-1">
          {[
            { key: 'all',    label: `All (${counts.all})`       },
            { key: 'active', label: `Live (${counts.active})`   },
            { key: 'draft',  label: `Drafts (${counts.draft})`  },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="text-sm px-4 py-2 rounded-lg transition font-medium"
              style={filter === t.key
                ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-nav-text)' }
                : { color: '#6b7280' }}>
              {t.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm text-gray-400 mb-3">
              {filter === 'all' ? 'No lessons uploaded yet.' : `No ${filter} lessons.`}
            </p>
            <Link href="/dashboard/tutor/upload"
              className="text-xs px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              Upload your first lesson
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header row */}
            <div className="grid px-5 py-3 border-b border-gray-100 text-xs font-medium text-gray-400"
              style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 80px' }}>
              <span>Lesson</span>
              <span>Price</span>
              <span>Purchases</span>
              <span>Uploaded</span>
              <span>Status</span>
            </div>

            {shown.map((l, i) => (
              <div key={l.id}
                className={`grid px-5 py-4 items-center gap-4 hover:bg-gray-50 transition ${i < shown.length - 1 ? 'border-b border-gray-50' : ''}`}
                style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 80px' }}>

                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{l.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{l.subject} · {l.form_level ?? 'All levels'}</div>
                </div>

                <span className="text-sm text-gray-700">K{l.price}</span>

                <span className="text-sm text-gray-700">{l.purchase_count ?? 0}</span>

                <span className="text-xs text-gray-400">{formatDate(l.created_at)}</span>

                <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize text-center"
                  style={{
                    backgroundColor: l.status === 'active' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)',
                    color: l.status === 'active' ? 'var(--color-badge-text)' : 'var(--color-stat-b-sub)',
                  }}>
                  {l.status ?? 'draft'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
