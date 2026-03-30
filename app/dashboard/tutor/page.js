'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function TutorDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [tutorProfile, setTutorProfile] = useState(null)
  const [lessons, setLessons] = useState([])
  const [bookings, setBookings] = useState([])
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const [{ data: prof }, { data: tutor }, { data: less }, { data: books }] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
        supabase.from('tutors').select('*').eq('user_id', user.id).single(),
        supabase.from('lessons')
          .select('id, title, subject, form_level, status, purchase_count, price, created_at')
          .eq('tutor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('bookings')
          .select('id, subject, scheduled_at, status, amount, student_id, profiles(full_name)')
          .eq('tutor_id', user.id)
          .order('scheduled_at', { ascending: false })
          .limit(10),
      ])

      setProfile(prof)
      setTutorProfile(tutor)
      setLessons(less ?? [])
      setBookings(books ?? [])

      // Calculate earnings per month from completed bookings
      const completed = (books ?? []).filter(b => b.status === 'completed')
      const byMonth = {}
      completed.forEach(b => {
        const month = new Date(b.scheduled_at).toLocaleDateString('en-ZM', { month: 'short', year: '2-digit' })
        byMonth[month] = (byMonth[month] ?? 0) + (b.amount ?? 0)
      })
      setEarnings(Object.entries(byMonth).slice(-3).map(([month, amount]) => ({ month, amount })))

      setLoading(false)
    }
    load()
  }, [router])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const totalEarnings = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.amount ?? 0), 0)
  const totalPurchases = lessons.reduce((sum, l) => sum + (l.purchase_count ?? 0), 0)
  const maxEarning = Math.max(...earnings.map(e => e.amount), 1)

  const stats = [
    { label: 'Lessons uploaded',   value: lessons.length,    type: 'a' },
    { label: 'Total purchases',    value: totalPurchases,    type: 'a' },
    { label: 'Sessions completed', value: bookings.filter(b => b.status === 'completed').length, type: 'b' },
    { label: 'Total earned (ZMW)', value: `K${totalEarnings.toLocaleString()}`, type: 'b' },
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
              {pendingBookings.length > 0
                ? `You have ${pendingBookings.length} session request${pendingBookings.length > 1 ? 's' : ''} waiting.`
                : 'No pending session requests.'}
            </p>
          </div>
          <Link href="/dashboard/tutor/upload"
            className="text-sm px-5 py-2.5 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}>
            + Upload lesson
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Not approved warning */}
        {tutorProfile && !tutorProfile.is_approved && (
          <div className="mb-6 px-5 py-4 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--color-stat-b-bg)', borderColor: 'var(--color-accent-mid)', color: 'var(--color-stat-b-text)' }}>
            Your tutor profile is pending approval. You can upload lessons but they won&apos;t be visible to students until an admin approves your account.
          </div>
        )}

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* My lessons */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>My lessons</h2>
              <Link href="/dashboard/tutor/upload" className="text-xs hover:underline"
                style={{ color: 'var(--color-primary-lit)' }}>
                + Upload new
              </Link>
            </div>
            {lessons.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">No lessons uploaded yet.</p>
                <Link href="/dashboard/tutor/upload"
                  className="text-xs px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                  Upload your first lesson
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                        {l.subject?.slice(0, 3) ?? '—'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{l.title}</div>
                        <div className="text-xs text-gray-400">{l.purchase_count ?? 0} purchases · K{l.price}</div>
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-medium capitalize"
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

          {/* Earnings */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-primary)' }}>
            <h2 className="font-serif text-lg mb-1" style={{ color: 'var(--color-nav-text)' }}>Earnings</h2>
            <p className="text-xs mb-5" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>
              From completed sessions
            </p>
            {earnings.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-nav-text)', opacity: 0.5 }}>
                No completed sessions yet.
              </p>
            ) : (
              <div className="space-y-3">
                {earnings.map(e => (
                  <div key={e.month}>
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-nav-text)' }}>
                      <span>{e.month}</span>
                      <span style={{ opacity: 0.7 }}>K{e.amount.toLocaleString()}</span>
                    </div>
                    <div className="rounded-full h-2" style={{ backgroundColor: 'var(--color-primary-mid)' }}>
                      <div className="h-2 rounded-full"
                        style={{ width: `${Math.round(e.amount / maxEarning * 100)}%`, backgroundColor: 'var(--color-accent-lit)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-primary-mid)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Total earned</div>
              <div className="font-serif text-2xl mb-3" style={{ color: 'var(--color-accent-lit)' }}>
                K{totalEarnings.toLocaleString()}
              </div>
              <button className="w-full text-xs py-2 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}>
                Withdraw via Mobile Money
              </button>
            </div>
          </div>
        </div>

        {/* Session requests */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>Session requests</h2>
            {pendingBookings.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'var(--color-stat-b-bg)', color: 'var(--color-stat-b-sub)' }}>
                {pendingBookings.length} pending
              </span>
            )}
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No session requests yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => {
                const studentName = b.profiles?.full_name ?? 'Student'
                const initials = studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                const date = new Date(b.scheduled_at).toLocaleDateString('en-ZM', {
                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })
                return (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{studentName}</div>
                        <div className="text-xs text-gray-400">{b.subject} · {date} · K{b.amount}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.status === 'pending' ? (
                        <>
                          <button
                            onClick={async () => {
                              await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', b.id)
                              setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'confirmed' } : x))
                            }}
                            className="text-xs px-4 py-1.5 rounded-lg font-medium"
                            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                            Accept
                          </button>
                          <button
                            onClick={async () => {
                              await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', b.id)
                              setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'cancelled' } : x))
                            }}
                            className="text-xs border border-gray-200 text-gray-500 px-4 py-1.5 rounded-lg hover:bg-gray-50">
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full capitalize"
                          style={{
                            backgroundColor: b.status === 'confirmed' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)',
                            color: b.status === 'confirmed' ? 'var(--color-badge-text)' : 'var(--color-stat-b-sub)',
                          }}>
                          {b.status}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
