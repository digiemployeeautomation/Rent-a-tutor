'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function StudentDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [lessons, setLessons] = useState([])
  const [bookings, setBookings] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const [{ data: prof }, { data: books }, { data: purch }] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
        supabase.from('bookings')
          .select('id, subject, scheduled_at, status, amount, tutor_id, tutors(id, profiles(full_name))')
          .eq('student_id', user.id)
          .order('scheduled_at', { ascending: true })
          .limit(5),
        supabase.from('lesson_purchases')
          .select('id, purchased_at, amount_paid, lessons(id, title, subject, form_level, tutor_id)')
          .eq('student_id', user.id)
          .order('purchased_at', { ascending: false })
          .limit(5),
      ])

      setProfile(prof)
      setBookings(books ?? [])
      setPurchases(purch ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const upcomingBookings = bookings.filter(b =>
    ['pending', 'confirmed'].includes(b.status) &&
    new Date(b.scheduled_at) >= new Date()
  )

  const stats = [
    { label: 'Lessons purchased', value: purchases.length, type: 'a' },
    { label: 'Sessions booked',   value: bookings.length,  type: 'a' },
    { label: 'Upcoming sessions', value: upcomingBookings.length, type: 'b' },
    { label: 'Subjects browsed',  value: new Set(purchases.map(p => p.lessons?.subject).filter(Boolean)).size, type: 'b' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Loading your dashboard...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Banner */}
      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-nav-text)', opacity: 0.7 }}>
              {upcomingBookings.length > 0
                ? `You have ${upcomingBookings.length} upcoming session${upcomingBookings.length > 1 ? 's' : ''}.`
                : 'No upcoming sessions — book one below.'}
            </p>
          </div>
          <Link
            href="/tutor"
            className="text-sm px-5 py-2.5 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}
          >
            Book a session
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ backgroundColor: s.type === 'a' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)' }}>
              <div className="text-xs font-medium mb-1"
                style={{ color: s.type === 'a' ? 'var(--color-stat-a-sub)' : 'var(--color-stat-b-sub)' }}>
                {s.label}
              </div>
              <div className="font-serif text-3xl"
                style={{ color: s.type === 'a' ? 'var(--color-stat-a-text)' : 'var(--color-stat-b-text)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Recent purchases */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>Recent lessons</h2>
              <Link href="/browse" className="text-xs hover:underline" style={{ color: 'var(--color-primary-lit)' }}>
                Browse more →
              </Link>
            </div>
            {purchases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">No lessons purchased yet.</p>
                <Link href="/browse"
                  className="text-xs px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                  Browse lessons
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map(p => (
                  <div key={p.id} className="flex items-center gap-4 cursor-pointer group">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                      {p.lessons?.subject?.slice(0, 3) ?? '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{p.lessons?.title ?? 'Lesson'}</div>
                      <div className="text-xs text-gray-400">{p.lessons?.subject} · {p.lessons?.form_level}</div>
                    </div>
                    <div className="text-xs text-gray-400">K{p.amount_paid}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming sessions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>Upcoming sessions</h2>
              <Link href="/tutor" className="text-xs hover:underline" style={{ color: 'var(--color-primary-lit)' }}>
                Book a tutor →
              </Link>
            </div>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">No upcoming sessions.</p>
                <Link href="/tutor"
                  className="text-xs px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                  Find a tutor
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map(b => {
                  const tutorName = b.tutors?.profiles?.full_name ?? 'Tutor'
                  const initials = tutorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  const date = new Date(b.scheduled_at).toLocaleDateString('en-ZM', {
                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                  return (
                    <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                        {initials}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{tutorName}</div>
                        <div className="text-xs text-gray-400">{b.subject} · {date}</div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-medium capitalize"
                        style={{ backgroundColor: 'var(--color-stat-a-bg)', color: 'var(--color-badge-text)' }}>
                        {b.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* All bookings history */}
        {bookings.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-5" style={{ color: 'var(--color-primary)' }}>Session history</h2>
            <div className="space-y-3">
              {bookings.map(b => {
                const tutorName = b.tutors?.profiles?.full_name ?? 'Tutor'
                const date = new Date(b.scheduled_at).toLocaleDateString('en-ZM', {
                  weekday: 'short', month: 'short', day: 'numeric'
                })
                return (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{tutorName}</div>
                      <div className="text-xs text-gray-400">{b.subject} · {date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">K{b.amount}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{
                          backgroundColor: b.status === 'completed' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)',
                          color: b.status === 'completed' ? 'var(--color-badge-text)' : 'var(--color-stat-b-sub)',
                        }}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
