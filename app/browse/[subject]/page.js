'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

const SUBJECTS = [
  'Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics',
  'Geography', 'History', 'Civic Education', 'Computer Studies',
  'Additional Mathematics', 'Commerce', 'Principles of Accounts',
  'French', 'Further Mathematics', 'Economics', 'Literature in English',
  'Business Studies', 'Computer Science', 'Accounting',
]

const SORT_OPTIONS = [
  { value: 'popular',    label: 'Most popular'    },
  { value: 'newest',     label: 'Newest first'    },
  { value: 'price_asc',  label: 'Price: low–high' },
  { value: 'price_desc', label: 'Price: high–low' },
]

function formatDuration(secs) {
  if (!secs) return null
  const m = Math.floor(secs / 60)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
}

export default function BrowsePage() {
  const params = useParams()
  const urlSubject = params?.subject ? decodeURIComponent(params.subject) : ''

  const [lessons, setLessons]     = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]       = useState('')
  const [subject, setSubject]     = useState(urlSubject)
  const [level, setLevel]         = useState('')
  const [sort, setSort]           = useState('popular')
  const [page, setPage]           = useState(0)
  const PAGE_SIZE = 12

  // Keep subject in sync if user navigates between subject URLs
  useEffect(() => { setSubject(urlSubject) }, [urlSubject])

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('lessons')
      .select(`
        id, title, subject, form_level, price,
        duration_seconds, purchase_count, created_at,
        tutors ( id, profiles ( full_name ) )
      `, { count: 'exact' })
      .eq('status', 'active')

    if (search.trim()) query = query.ilike('title', `%${search.trim()}%`)
    if (subject)       query = query.eq('subject', subject)
    if (level === 'o_level') query = query.or('form_level.ilike.%O-Level%,form_level.ilike.%Form 1%,form_level.ilike.%Form 2%,form_level.ilike.%Form 3%,form_level.ilike.%Form 4%')
    if (level === 'a_level') query = query.or('form_level.ilike.%A-Level%,form_level.ilike.%Form 5%,form_level.ilike.%Form 6%')

    if (sort === 'popular')    query = query.order('purchase_count', { ascending: false })
    if (sort === 'newest')     query = query.order('created_at',     { ascending: false })
    if (sort === 'price_asc')  query = query.order('price',          { ascending: true  })
    if (sort === 'price_desc') query = query.order('price',          { ascending: false })

    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    const { data, count } = await query
    setLessons(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [search, subject, level, sort, page])

  useEffect(() => { setPage(0) }, [search, subject, level, sort])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      <div className="px-6 py-10" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-xs mb-4 inline-block opacity-60 hover:opacity-100"
            style={{ color: 'var(--color-surface-mid)' }}>
            ← Back to home
          </Link>
          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--color-surface-mid)' }}>
            {subject ? subject : 'Browse lessons'}
          </h1>
          <p className="text-sm opacity-70 mb-6" style={{ color: 'var(--color-surface-mid)' }}>
            {total} lesson{total !== 1 ? 's' : ''} available
          </p>
          <div className="flex max-w-xl bg-white rounded-xl overflow-hidden">
            <input
              type="text"
              placeholder="Search by lesson title or topic..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="flex-1 px-5 py-3 text-sm outline-none text-gray-700"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')}
                className="px-4 text-gray-400 hover:text-gray-600 text-sm">✕</button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          <aside className="lg:w-52 flex-shrink-0">
            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Level</h3>
              <div className="space-y-1">
                {[
                  { value: '',        label: 'All levels' },
                  { value: 'o_level', label: 'O-Level (Forms 1–4)' },
                  { value: 'a_level', label: 'A-Level (Forms 5–6)' },
                ].map(l => (
                  <button key={l.value} onClick={() => setLevel(l.value)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg transition"
                    style={level === l.value
                      ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', fontWeight: 500 }
                      : { color: '#6b7280' }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Subject</h3>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                <button onClick={() => setSubject('')}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg transition"
                  style={subject === ''
                    ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', fontWeight: 500 }
                    : { color: '#6b7280' }}>
                  All subjects
                </button>
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => setSubject(s)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg transition"
                    style={subject === s
                      ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', fontWeight: 500 }
                      : { color: '#6b7280' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {(subject || level || search) && (
              <button
                onClick={() => { setSubject(''); setLevel(''); setSearchInput('') }}
                className="text-xs underline"
                style={{ color: 'var(--color-primary-lit)' }}>
                Clear all filters
              </button>
            )}
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${total} result${total !== 1 ? 's' : ''}`}
              </p>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none bg-white text-gray-700">
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 h-44 animate-pulse" />
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
                <p className="text-sm text-gray-400 mb-1">No lessons found.</p>
                <p className="text-xs text-gray-300">Try adjusting your filters or search term.</p>
                {(subject || level || search) && (
                  <button
                    onClick={() => { setSubject(''); setLevel(''); setSearchInput('') }}
                    className="mt-4 text-xs px-4 py-2 rounded-lg"
                    style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {lessons.map(l => {
                    const tutorName = l.tutors?.profiles?.full_name ?? 'Tutor'
                    const duration  = formatDuration(l.duration_seconds)
                    return (
                      <div key={l.id}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                            {l.form_level ?? 'All levels'}
                          </span>
                          {duration && <span className="text-xs text-gray-400">{duration}</span>}
                        </div>
                        <span className="text-xs text-gray-400 mb-1">{l.subject}</span>
                        <h3 className="text-sm font-medium text-gray-800 leading-snug mb-1 flex-1">
                          {l.title}
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">by {tutorName}</p>
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
                          <span className="text-xs text-gray-400">
                            {l.purchase_count ?? 0} purchase{l.purchase_count !== 1 ? 's' : ''}
                          </span>
                          <Link
                            href={`/browse/${encodeURIComponent(l.subject)}/lesson/${l.id}`}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: '#e8c84a', color: '#1a2a00' }}>
                            Buy — K{l.price}
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="text-xs px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                      ← Prev
                    </button>
                    <span className="text-xs text-gray-500 px-2">Page {page + 1} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                      className="text-xs px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
