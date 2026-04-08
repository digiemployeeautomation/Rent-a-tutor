'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/spinner'
import { SUBJECTS } from '@/lib/constants'

export default function FindTutorPage() {
  const [tutors, setTutors]         = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]         = useState('')
  const [subject, setSubject]       = useState('')
  const [sort, setSort]             = useState('rating')
  const [page, setPage]             = useState(0)
  const PAGE_SIZE = 12

  const load = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('tutors')
      .select(`
        id, subjects, hourly_rate_kwacha, avg_rating, total_reviews,
        is_featured, verification_status, badge,
        profiles!user_id ( full_name, avatar_url )
      `, { count: 'exact' })
      .eq('is_approved', true)

    if (subject) query = query.contains('subjects', [subject])

    if (sort === 'rating')     query = query.order('avg_rating',          { ascending: false })
    if (sort === 'price_asc')  query = query.order('hourly_rate_kwacha',  { ascending: true  })
    if (sort === 'price_desc') query = query.order('hourly_rate_kwacha',  { ascending: false })
    if (sort === 'reviews')    query = query.order('total_reviews',       { ascending: false })

    query = query.order('is_featured', { ascending: false })
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    const { data, count } = await query
    let rows = data ?? []

    // Client-side name search (PostgREST can't filter on joined columns directly)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(t =>
        t.profiles?.full_name?.toLowerCase().includes(q)
      )
    }

    setTutors(rows)
    // When client-side name filter is active, use filtered count for accurate pagination
    setTotal(search.trim() ? rows.length : (count ?? 0))
    setLoading(false)
  }, [search, subject, sort, page])

  useEffect(() => { setPage(0) }, [search, subject, sort])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Header */}
      <div className="px-6 py-10" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-xs mb-4 inline-block opacity-60 hover:opacity-100"
            style={{ color: 'var(--color-surface-mid)' }}>
            ← Back to home
          </Link>
          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--color-surface-mid)' }}>
            Find a tutor
          </h1>
          <p className="text-sm opacity-70 mb-6" style={{ color: 'var(--color-surface-mid)' }}>
            Book a private session with a qualified Zambian tutor
          </p>
          <div className="flex max-w-xl bg-white rounded-xl overflow-hidden">
            <input
              type="text"
              placeholder="Search by tutor name..."
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

          {/* Sidebar */}
          <aside className="lg:w-52 flex-shrink-0">
            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Sort by</h3>
              <div className="space-y-1">
                {[
                  { value: 'rating',     label: 'Top rated'       },
                  { value: 'reviews',    label: 'Most reviewed'   },
                  { value: 'price_asc',  label: 'Price: low–high' },
                  { value: 'price_desc', label: 'Price: high–low' },
                ].map(o => (
                  <button key={o.value} onClick={() => setSort(o.value)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg transition"
                    style={sort === o.value
                      ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', fontWeight: 500 }
                      : { color: '#6b7280' }}>
                    {o.label}
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

            {(subject || search) && (
              <button onClick={() => { setSubject(''); setSearchInput('') }}
                className="text-xs underline"
                style={{ color: 'var(--color-primary-lit)' }}>
                Clear filters
              </button>
            )}
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {loading ? <Spinner size={14} className="text-gray-400" /> : `${tutors.length} tutor${tutors.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 h-52 animate-pulse" />
                ))}
              </div>
            ) : tutors.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
                <p className="text-sm text-gray-400 mb-1">No tutors found.</p>
                <p className="text-xs text-gray-300">Try a different subject or search term.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tutors.map(t => {
                    const name     = t.profiles?.full_name ?? 'Tutor'
                    const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
                    const avatar   = t.profiles?.avatar_url
                    return (
                      <Link key={t.id} href={`/tutor/${t.id}`}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition flex flex-col">

                        {/* Avatar + featured badge */}
                        <div className="flex items-start justify-between mb-3">
                          {avatar ? (
                            <img src={avatar} alt={name}
                              className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium"
                              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                              {initials}
                            </div>
                          )}
                          {t.is_featured && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-accent)' }}>
                              Featured
                            </span>
                          )}
                        </div>

                        <div className="text-sm font-medium text-gray-800 mb-0.5">{name}</div>

                        {t.badge && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-2 w-fit"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                            ✓ {t.badge}
                          </span>
                        )}

                        <p className="text-xs text-gray-500 mb-3 flex-1 line-clamp-2">
                          {(t.subjects ?? []).slice(0, 3).join(' · ')}
                        </p>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
                          <span className="text-xs text-gray-500">
                            ★ {t.avg_rating?.toFixed(1) ?? '—'} · {t.total_reviews ?? 0} review{t.total_reviews !== 1 ? 's' : ''}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-primary-lit)' }}>
                            K{t.hourly_rate_kwacha}/hr
                          </span>
                        </div>
                      </Link>
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

      {/* CTA for tutors */}
      <div className="border-t border-gray-200 bg-white px-6 py-10 text-center">
        <h2 className="font-serif text-xl mb-2" style={{ color: 'var(--color-primary)' }}>
          Are you a tutor?
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Join Rent a Tutor and earn by teaching O-Level and A-Level students across Zambia.
        </p>
        <Link href="/auth/register"
          className="text-sm px-6 py-2.5 rounded-lg font-medium inline-block"
          style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
          Sign up as a tutor
        </Link>
      </div>
    </div>
  )
}
