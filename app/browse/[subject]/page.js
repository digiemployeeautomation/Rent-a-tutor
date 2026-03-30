'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

export default function SubjectPage() {
  const params = useParams()
  const subjectName = decodeURIComponent(params.subject)

  const [lessons, setLessons] = useState([])
  const [tutors, setTutors] = useState([])
  const [filter, setFilter] = useState('all') // 'all' | 'o_level' | 'a_level'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: lessonRows }, { data: tutorRows }] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title, subject, form_level, price, duration_seconds, purchase_count, tutor_id, tutors(id, profiles(full_name))')
          .eq('subject', subjectName)
          .eq('status', 'active')
          .order('purchase_count', { ascending: false }),
        supabase
          .from('tutors')
          .select('id, subjects, hourly_rate_kwacha, avg_rating, total_reviews, badge, profiles(full_name, avatar_url)')
          .eq('is_approved', true)
          .contains('subjects', [subjectName])
          .order('avg_rating', { ascending: false })
          .limit(8),
      ])
      setLessons(lessonRows ?? [])
      setTutors(tutorRows ?? [])
      setLoading(false)
    }
    load()
  }, [subjectName])

  const filteredLessons = lessons.filter(l => {
    if (filter === 'all') return true
    if (filter === 'o_level') return l.form_level?.toLowerCase().includes('o-level') || parseInt(l.form_level) <= 4
    if (filter === 'a_level') return l.form_level?.toLowerCase().includes('a-level') || parseInt(l.form_level) >= 5
    return true
  })

  function formatDuration(secs) {
    if (!secs) return '—'
    const m = Math.floor(secs / 60)
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
  }

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
            {subjectName}
          </h1>
          <p className="text-sm opacity-70" style={{ color: 'var(--color-surface-mid)' }}>
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} · {tutors.length} tutor{tutors.length !== 1 ? 's' : ''}
          </p>

          {/* Level filter */}
          <div className="flex gap-2 mt-6">
            {[
              { value: 'all',     label: 'All levels'  },
              { value: 'o_level', label: 'O-Level'     },
              { value: 'a_level', label: 'A-Level'     },
            ].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className="text-xs px-4 py-1.5 rounded-full transition"
                style={filter === f.value
                  ? { backgroundColor: '#e8c84a', color: '#1a2a00', fontWeight: 500 }
                  : { backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--color-surface-mid)' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Lessons */}
            <div className="mb-12">
              <h2 className="font-serif text-xl mb-5" style={{ color: 'var(--color-primary)' }}>
                Lessons {filter !== 'all' && `· ${filter === 'o_level' ? 'O-Level' : 'A-Level'}`}
              </h2>

              {filteredLessons.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-sm text-gray-400">No lessons available for this filter yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLessons.map(l => {
                    const tutorName = l.tutors?.profiles?.full_name ?? 'Tutor'
                    return (
                      <div key={l.id}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                            {l.form_level ?? 'All levels'}
                          </div>
                          <span className="text-xs text-gray-400">{formatDuration(l.duration_seconds)}</span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-800 mb-1 leading-snug">{l.title}</h3>
                        <p className="text-xs text-gray-400 mb-4">{tutorName}</p>
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          <span className="text-xs text-gray-400">{l.purchase_count ?? 0} purchases</span>
                          <Link href={`/browse/${encodeURIComponent(subjectName)}/lesson/${l.id}`}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: '#e8c84a', color: '#1a2a00' }}>
                            Buy — K{l.price}
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Tutors for this subject */}
            {tutors.length > 0 && (
              <div>
                <h2 className="font-serif text-xl mb-5" style={{ color: 'var(--color-primary)' }}>
                  Tutors for {subjectName}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tutors.map(t => {
                    const name = t.profiles?.full_name ?? 'Tutor'
                    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <Link key={t.id} href={`/tutor/${t.id}`}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition block">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium mb-3"
                          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                          {initials}
                        </div>
                        <div className="text-sm font-medium mb-1">{name}</div>
                        {t.badge && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-2"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                            ✓ {t.badge}
                          </span>
                        )}
                        <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-2">
                          <span className="text-xs text-gray-500">
                            ★ {t.avg_rating?.toFixed(1) ?? '—'} · {t.total_reviews ?? 0} reviews
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-primary-lit)' }}>
                            K{t.hourly_rate_kwacha}/hr
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
