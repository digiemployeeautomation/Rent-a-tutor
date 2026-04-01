'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats]             = useState(null)
  const [pendingTutors, setPendingTutors] = useState([])
  const [recentLessons, setRecentLessons] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const [
        { count: tutorCount },
        { count: studentCount },
        { count: lessonCount },
        { count: pendingCount },
        { data: pending },
        { data: lessons },
      ] = await Promise.all([
        supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('tutors')
          .select('id, created_at, subjects, profiles(full_name, avatar_url)')
          .eq('is_approved', false)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('lessons')
          .select('id, title, subject, status, created_at, tutors(profiles(full_name))')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      setStats({ tutors: tutorCount ?? 0, students: studentCount ?? 0, lessons: lessonCount ?? 0, pending: pendingCount ?? 0 })
      setPendingTutors(pending ?? [])
      setRecentLessons(lessons ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function approveTutor(id) {
    await supabase.from('tutors').update({ is_approved: true }).eq('id', id)
    // Also activate their draft lessons
    await supabase.from('lessons').update({ status: 'active' }).eq('tutor_id', id).eq('status', 'draft')
    setPendingTutors(prev => prev.filter(t => t.id !== id))
    setStats(s => s ? { ...s, pending: s.pending - 1, tutors: s.tutors + 1 } : s)
  }

  async function rejectTutor(id) {
    await supabase.from('tutors').delete().eq('id', id)
    setPendingTutors(prev => prev.filter(t => t.id !== id))
    setStats(s => s ? { ...s, pending: s.pending - 1 } : s)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Loading admin dashboard...</div>
      </div>
    </div>
  )

  const statCards = [
    { label: 'Approved tutors',    value: stats?.tutors,   href: '/admin/users?role=tutor'   },
    { label: 'Students',           value: stats?.students, href: '/admin/users?role=student'  },
    { label: 'Active lessons',     value: stats?.lessons,  href: '/admin/users'               },
    { label: 'Pending approvals',  value: stats?.pending,  href: '/admin/users?tab=pending', highlight: stats?.pending > 0 },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>
              Admin dashboard
            </h1>
            <p className="text-sm mt-0.5 opacity-70" style={{ color: 'var(--color-nav-text)' }}>
              Rent a Tutor · Zambia
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/users"
              className="text-sm px-4 py-2 rounded-lg border"
              style={{ color: 'var(--color-nav-text)', borderColor: 'rgba(255,255,255,0.25)' }}>
              Users
            </Link>
            <Link href="/admin/payments"
              className="text-sm px-4 py-2 rounded-lg border"
              style={{ color: 'var(--color-nav-text)', borderColor: 'rgba(255,255,255,0.25)' }}>
              Payments
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
            <Link key={s.label} href={s.href}
              className="rounded-2xl p-4 block hover:opacity-90 transition"
              style={{ backgroundColor: s.highlight ? 'var(--color-stat-b-bg)' : 'var(--color-stat-a-bg)' }}>
              <div className="text-xs font-medium mb-1"
                style={{ color: s.highlight ? 'var(--color-stat-b-sub)' : 'var(--color-stat-a-sub)' }}>
                {s.label}
              </div>
              <div className="font-serif text-3xl"
                style={{ color: s.highlight ? 'var(--color-stat-b-text)' : 'var(--color-stat-a-text)' }}>
                {s.value}
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Pending tutor approvals */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>
                Pending approvals
              </h2>
              {(stats?.pending ?? 0) > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: 'var(--color-stat-b-bg)', color: 'var(--color-stat-b-sub)' }}>
                  {stats.pending} waiting
                </span>
              )}
            </div>

            {pendingTutors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No tutors pending approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTutors.map(t => {
                  const name = t.profiles?.full_name ?? 'Tutor'
                  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{name}</div>
                          <div className="text-xs text-gray-400">
                            {(t.subjects ?? []).slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => approveTutor(t.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                          Approve
                        </button>
                        <button onClick={() => rejectTutor(t.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                          Reject
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent lessons */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>
                Recent lessons
              </h2>
              <Link href="/admin/users" className="text-xs hover:underline"
                style={{ color: 'var(--color-primary-lit)' }}>View all →</Link>
            </div>
            {recentLessons.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No lessons yet.</p>
            ) : (
              <div className="space-y-3">
                {recentLessons.map(l => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-800 truncate max-w-xs">{l.title}</div>
                      <div className="text-xs text-gray-400">
                        {l.subject} · {l.tutors?.profiles?.full_name ?? 'Unknown'}
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full capitalize ml-3 flex-shrink-0"
                      style={{
                        backgroundColor: l.status === 'active' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)',
                        color: l.status === 'active' ? 'var(--color-badge-text)' : 'var(--color-stat-b-sub)',
                      }}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
