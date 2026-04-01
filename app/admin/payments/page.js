'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZM', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [tab, setTab]           = useState('purchases')
  const [purchases, setPurchases] = useState([])
  const [bookings, setBookings]  = useState([])
  const [loading, setLoading]   = useState(true)
  const [totals, setTotals]     = useState({ revenue: 0, platform: 0, tutor: 0 })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const [{ data: purch }, { data: books }] = await Promise.all([
        supabase
          .from('lesson_purchases')
          .select('id, amount_paid, purchased_at, transaction_id, student_id, lesson_id, lessons(title, subject, price), profiles(full_name)')
          .order('purchased_at', { ascending: false })
          .limit(50),
        supabase
          .from('bookings')
          .select('id, amount, status, scheduled_at, subject, student_id, tutor_id, profiles(full_name)')
          .order('scheduled_at', { ascending: false })
          .limit(50),
      ])

      const purchRows = purch ?? []
      const bookRows  = books ?? []

      const totalRevenue  = purchRows.reduce((s, p) => s + (p.amount_paid ?? 0), 0)
      const platformShare = Math.round(totalRevenue * 0.3)
      const tutorShare    = totalRevenue - platformShare

      setPurchases(purchRows)
      setBookings(bookRows)
      setTotals({ revenue: totalRevenue, platform: platformShare, tutor: tutorShare })
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Loading payments...</div>
      </div>
    </div>
  )

  const shown = tab === 'purchases' ? purchases : bookings

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <nav className="text-xs mb-1 opacity-60" style={{ color: 'var(--color-nav-text)' }}>
              <Link href="/admin" className="hover:opacity-100">Admin</Link> / Payments
            </nav>
            <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>Payments</h1>
          </div>
          <Link href="/admin" className="text-xs px-4 py-2 rounded-lg border"
            style={{ color: 'var(--color-nav-text)', borderColor: 'rgba(255,255,255,0.25)' }}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Revenue summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total revenue',    value: totals.revenue,   type: 'a' },
            { label: 'Platform (30%)',   value: totals.platform,  type: 'b' },
            { label: 'Tutor share (70%)', value: totals.tutor,   type: 'a' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ backgroundColor: s.type === 'a' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)' }}>
              <div className="text-xs font-medium mb-1"
                style={{ color: s.type === 'a' ? 'var(--color-stat-a-sub)' : 'var(--color-stat-b-sub)' }}>
                {s.label}
              </div>
              <div className="font-serif text-2xl"
                style={{ color: s.type === 'a' ? 'var(--color-stat-a-text)' : 'var(--color-stat-b-text)' }}>
                K{s.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit gap-1">
          {[
            { key: 'purchases', label: `Lesson purchases (${purchases.length})` },
            { key: 'bookings',  label: `Session bookings (${bookings.length})`  },
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

        {shown.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm text-gray-400">No records yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid px-5 py-3 border-b border-gray-100 text-xs font-medium text-gray-400"
              style={{ gridTemplateColumns: tab === 'purchases' ? '2fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr' }}>
              <span>{tab === 'purchases' ? 'Lesson' : 'Subject'}</span>
              <span>Student</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
            </div>

            {shown.map((row, i) => {
              const isPurchase = tab === 'purchases'
              const isLast = i === shown.length - 1

              return (
                <div key={row.id}
                  className={`grid px-5 py-3.5 items-center gap-4 text-sm ${!isLast ? 'border-b border-gray-50' : ''}`}
                  style={{ gridTemplateColumns: isPurchase ? '2fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr' }}>

                  {isPurchase ? (
                    <div>
                      <div className="font-medium text-gray-800 truncate">{row.lessons?.title ?? '—'}</div>
                      <div className="text-xs text-gray-400">{row.lessons?.subject}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-gray-800">{row.subject}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize mt-0.5 inline-block"
                        style={{
                          backgroundColor: row.status === 'completed' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)',
                          color: row.status === 'completed' ? 'var(--color-badge-text)' : 'var(--color-stat-b-sub)',
                        }}>
                        {row.status}
                      </span>
                    </div>
                  )}

                  <span className="text-gray-600 truncate">{row.profiles?.full_name ?? '—'}</span>
                  <span className="text-gray-400 text-xs">
                    {formatDate(isPurchase ? row.purchased_at : row.scheduled_at)}
                  </span>
                  <span className="text-right font-medium" style={{ color: 'var(--color-primary-lit)' }}>
                    K{isPurchase ? row.amount_paid : row.amount}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
