'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/spinner'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function StudentPurchasesPage() {
  const router = useRouter()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const { data } = await supabase
        .from('lesson_purchases')
        .select('id, amount_paid, purchased_at, lessons(id, title, subject, form_level, cloudflare_video_id)')
        .eq('student_id', user.id)
        .order('purchased_at', { ascending: false })

      setPurchases(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="text-gray-400" />
    </div>
  )

  return (
    <>
      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs mb-2 opacity-60" style={{ color: 'var(--color-nav-text)' }}>
            <Link href="/dashboard/student" className="hover:opacity-100">Dashboard</Link>
            {' / '}My Purchases
          </nav>
          <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>My Purchases</h1>
          <p className="text-sm mt-0.5 opacity-70" style={{ color: 'var(--color-nav-text)' }}>
            {purchases.length} lesson{purchases.length !== 1 ? 's' : ''} purchased
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {purchases.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm text-gray-400 mb-3">You haven't purchased any lessons yet.</p>
            <Link href="/browse"
              className="text-xs px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              Browse lessons
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map(p => {
              const lesson  = p.lessons
              const subject = lesson?.subject ?? '—'
              const initials = subject.slice(0, 3).toUpperCase()
              const hasVideo = !!lesson?.cloudflare_video_id

              return (
                <div key={p.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {lesson?.title ?? 'Lesson'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {subject} · {lesson?.form_level ?? 'All levels'} · Purchased {formatDate(p.purchased_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">K{p.amount_paid}</span>
                    {lesson && (
                      <Link
                        href={`/browse/${encodeURIComponent(lesson.subject)}/lesson/${lesson.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                        {hasVideo ? '▶ Watch' : 'View'}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
