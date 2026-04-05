'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TopicRequestFeed from '@/components/TopicRequestFeed'

export default function TutorTopicRequestsPage() {
  const router = useRouter()
  const [userId, setUserId]           = useState(null)
  const [tutorSubjects, setTutorSubjects] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const { data: tutor } = await supabase
        .from('tutors')
        .select('subjects')
        .eq('user_id', user.id)
        .single()

      setUserId(user.id)
      setTutorSubjects(tutor?.subjects ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-gray-400">Loading...</div>
    </div>
  )

  return (
    <>
      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs mb-2 opacity-60" style={{ color: 'var(--color-nav-text)' }}>
            <Link href="/dashboard/tutor" className="hover:opacity-100">Dashboard</Link>
            {' / '}Topic Requests
          </nav>
          <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>Topic Requests</h1>
          <p className="text-sm mt-0.5 opacity-70" style={{ color: 'var(--color-nav-text)' }}>
            Students looking for lessons on specific topics
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <TopicRequestFeed tutorId={userId} tutorSubjects={tutorSubjects} />
      </div>
    </>
  )
}
