'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ── Withdraw modal ────────────────────────────────────────────────────────────
function WithdrawModal({ balance, onClose }) {
  const [phone, setPhone]   = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError]   = useState('')
  const [done, setDone]     = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const cleaned = phone.replace(/\s+/g, '')
    if (!/^(09|07)\d{8}$/.test(cleaned)) {
      setError('Enter a valid Zambian mobile number.')
      return
    }
    const num = parseInt(amount, 10)
    if (isNaN(num) || num < 50) {
      setError('Minimum withdrawal is K50.')
      return
    }
    if (num > balance) {
      setError(`You only have K${balance} available.`)
      return
    }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget && !done) onClose() }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>
              Withdraw earnings
            </h2>
            {!done && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Available balance: K{balance.toLocaleString()}</p>
        </div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-sm font-medium text-gray-800 mb-1">Withdrawal requested!</p>
            <p className="text-xs text-gray-500 mb-5">
              Your mobile money transfer will be processed within 1–2 business days.
            </p>
            <button onClick={onClose}
              className="text-sm px-5 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mobile money number</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="0971 234 567"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
              <p className="text-xs text-gray-400 mt-1">Airtel Money, MTN MoMo, or Zamtel Kwacha</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Amount (ZMW)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">K</span>
                <input type="number" required min="50" max={balance} value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Minimum K50"
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm outline-none focus:border-gray-400" />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>
            )}
            <button type="submit"
              className="w-full py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              Request withdrawal →
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function TutorDashboard() {
  const router = useRouter()
  const [profile, setProfile]           = useState(null)
  const [tutorProfile, setTutorProfile] = useState(null)
  const [recentLessons, setRecentLessons] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [stats, setStats]               = useState({ lessons: 0, purchases: 0, completed: 0, earnings: 0 })
  const [loading, setLoading]           = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const [
        { data: prof },
        { data: tutor },
        { count: lessonCount },
        { data: recentLess },
        { count: completedCount },
        { data: recentBooks },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single(),

        supabase
          .from('tutors')
          .select('*')
          .eq('user_id', user.id)
          .single(),

        // Exact lesson count for stat card
        supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('tutor_id', user.id),

        // Recent lessons for display (with purchase_count for earnings estimate)
        supabase
          .from('lessons')
          .select('id, title, subject, form_level, status, purchase_count, price, created_at')
          .eq('tutor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),

        // Exact completed session count for stat card
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('tutor_id', user.id)
          .eq('status', 'completed'),

        // Recent bookings for display + earnings bar chart
        supabase
          .from('bookings')
          .select('id, subject, scheduled_at, status, amount, student_id, profiles(full_name)')
          .eq('tutor_id', user.id)
          .order('scheduled_at', { ascending: false })
          .limit(10),
      ])

      const lessRows  = recentLess  ?? []
      const bookRows  = recentBooks ?? []

      // Total purchases across all lessons (sum of purchase_count column)
      const totalPurchases = lessRows.reduce((sum, l) => sum + (l.purchase_count ?? 0), 0)

      // Rental revenue: purchase_count × price per lesson
      const rentalRevenue = lessRows.reduce((sum, l) =>
        sum + ((l.purchase_count ?? 0) * (l.price ?? 0)), 0)

      // Session earnings from completed bookings in this page
      const sessionEarnings = bookRows
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.amount ?? 0), 0)

      setProfile(prof)
      setTutorProfile(tutor)
      setRecentLessons(lessRows)
      setRecentBookings(bookRows)
      setStats({
        lessons:   lessonCount    ?? 0,
        purchases: totalPurchases,
        completed: completedCount ?? 0,
        earnings:  sessionEarnings + rentalRevenue,
      })
      setLoading(false)
    }
    load()
  }, [router])

  const firstName       = profile?.full_name?.split(' ')[0] ?? 'there'
  const pendingBookings = recentBookings.filter(b => b.status === 'pending')

  // Earnings chart — last 3 months from visible bookings
  const byMonth = {}
  recentBookings.filter(b => b.status === 'completed').forEach(b => {
    const month = new Date(b.scheduled_at).toLocaleDateString('en-ZM', { month: 'short', year: '2-digit' })
    byMonth[month] = (byMonth[month] ?? 0) + (b.amount ?? 0)
  })
  const earnings    = Object.entries(byMonth).slice(-3).map(([month, amount]) => ({ month, amount }))
  const maxEarning  = Math.max(...earnings.map(e => e.amount), 1)

  const statCards = [
    { label: 'Lessons uploaded',   value: stats.lessons,             type: 'a' },
    { label: 'Total purchases',    value: stats.purchases,           type: 'a' },
    { label: 'Sessions completed', value: stats.completed,           type: 'b' },
    { label: 'Total earned (ZMW)', value: `K${stats.earnings.toLocaleString()}`, type: 'b' },
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

        {tutorProfile && !tutorProfile.is_approved && (
          <div className="mb-6 px-5 py-4 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--color-stat-b-bg)', borderColor: 'var(--color-accent-mid)', color: 'var(--color-stat-b-text)' }}>
            Your tutor profile is pending approval. You can upload lessons but they won&apos;t be visible to students until an admin approves your account.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
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
            {recentLessons.length === 0 ? (
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
                {recentLessons.map(l => (
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
                {stats.lessons > 10 && (
                  <p className="text-xs text-gray-400 text-center pt-2">
                    +{stats.lessons - 10} more lessons uploaded
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Earnings */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-primary)' }}>
            <h2 className="font-serif text-lg mb-1" style={{ color: 'var(--color-nav-text)' }}>Earnings</h2>
            <p className="text-xs mb-5" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>
              Sessions + lesson rentals
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
                K{stats.earnings.toLocaleString()}
              </div>
              <button
                onClick={() => setShowWithdraw(true)}
                className="w-full text-xs py-2 rounded-lg font-medium"
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
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No session requests yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map(b => {
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
                              setRecentBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'confirmed' } : x))
                            }}
                            className="text-xs px-4 py-1.5 rounded-lg font-medium"
                            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                            Accept
                          </button>
                          <button
                            onClick={async () => {
                              await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', b.id)
                              setRecentBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'cancelled' } : x))
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

      {showWithdraw && (
        <WithdrawModal
          balance={stats.earnings}
          onClose={() => setShowWithdraw(false)}
        />
      )}
    </div>
  )
}
