// components/admin/AnalyticsCards.js
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CurrencyIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function StatCard({ label, value, icon, color, loading }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4`}>
      <div className={`shrink-0 p-2.5 rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-8 w-20 bg-gray-100 animate-pulse rounded" />
        ) : (
          <p className="mt-0.5 text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function AnalyticsCards() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Total students
        const { count: totalStudents } = await supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true })

        // 2. Active subscriptions
        const { count: activeSubs } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        // 3. Revenue this month
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const { data: revenueRows } = await supabase
          .from('subscriptions')
          .select('price_paid')
          .gte('created_at', monthStart)

        const revenueThisMonth = (revenueRows ?? []).reduce(
          (sum, row) => sum + (Number(row.price_paid) || 0),
          0
        )

        // 4. Avg quiz score
        const { data: quizRows } = await supabase
          .from('quiz_attempts')
          .select('score, max_score')

        let avgScore = 0
        if (quizRows && quizRows.length > 0) {
          const validRows = quizRows.filter(r => r.max_score > 0)
          if (validRows.length > 0) {
            const total = validRows.reduce(
              (sum, r) => sum + (r.score / r.max_score) * 100,
              0
            )
            avgScore = total / validRows.length
          }
        }

        setData({
          totalStudents: totalStudents ?? 0,
          activeSubs: activeSubs ?? 0,
          revenueThisMonth,
          avgScore,
        })
      } catch (err) {
        console.error('AnalyticsCards fetch error:', err)
        setData({ totalStudents: 0, activeSubs: 0, revenueThisMonth: 0, avgScore: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const cards = [
    {
      label: 'Total Students',
      value: loading ? null : data?.totalStudents.toLocaleString(),
      icon: <UsersIcon />,
      color: 'bg-forest-50 text-forest-600',
    },
    {
      label: 'Active Subscriptions',
      value: loading ? null : data?.activeSubs.toLocaleString(),
      icon: <CheckCircleIcon />,
      color: 'bg-sage-100 text-sage-600',
    },
    {
      label: 'Revenue This Month',
      value: loading
        ? null
        : `$${data?.revenueThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <CurrencyIcon />,
      color: 'bg-gold-100 text-gold-500',
    },
    {
      label: 'Avg Quiz Score',
      value: loading ? null : `${data?.avgScore.toFixed(1)}%`,
      icon: <ChartIcon />,
      color: 'bg-blue-50 text-blue-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          color={card.color}
          loading={loading}
        />
      ))}
    </div>
  )
}
