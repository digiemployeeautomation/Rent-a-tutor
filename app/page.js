// app/page.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

const subjectMeta = {
  'Mathematics':      { initials: 'Math', bg: 'bg-sage-100',   text: 'text-forest-600'  },
  'English Language': { initials: 'Eng',  bg: 'bg-blue-100',   text: 'text-blue-800'    },
  'Biology':          { initials: 'Bio',  bg: 'bg-green-100',  text: 'text-green-800'   },
  'Chemistry':        { initials: 'Chem', bg: 'bg-yellow-100', text: 'text-yellow-800'  },
  'Physics':          { initials: 'Phy',  bg: 'bg-purple-100', text: 'text-purple-800'  },
  'Geography':        { initials: 'Geo',  bg: 'bg-orange-100', text: 'text-orange-800'  },
  'History':          { initials: 'His',  bg: 'bg-pink-100',   text: 'text-pink-800'    },
  'Computer Studies': { initials: 'ICT',  bg: 'bg-gray-100',   text: 'text-gray-700'    },
  'Commerce':         { initials: 'Com',  bg: 'bg-yellow-100', text: 'text-yellow-800'  },
  'Accounting':       { initials: 'Acc',  bg: 'bg-pink-100',   text: 'text-pink-800'    },
  'Economics':        { initials: 'Eco',  bg: 'bg-orange-100', text: 'text-orange-800'  },
}

function getMeta(name) {
  return subjectMeta[name] ?? { initials: name.slice(0, 3), bg: 'bg-gray-100', text: 'text-gray-700' }
}

export default function HomePage() {
  const [user, setUser]                     = useState(null)
  const [role, setRole]                     = useState(null)
  const [roleLoading, setRoleLoading]       = useState(true)
  const [subjects, setSubjects]             = useState([])
  const [tutors, setTutors]                 = useState([])
  const [tutorsLoading, setTutorsLoading]   = useState(true)
  const [lessonCounts, setLessonCounts]     = useState({})
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setRoleLoading(false); return }
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      setRole(profile?.role ?? 'student')
      setRoleLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null); setRole(null); setRoleLoading(false); return
      }
      setUser(session.user)
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single()
      setRole(profile?.role ?? 'student')
      setRoleLoading(false)
    })

    async function loadSubjects() {
      const { data: subjectRows } = await supabase
        .from('subjects').select('id, name, level').eq('curriculum', 'ecz').order('name')

      const { data: lessonRows } = await supabase
        .from('lessons').select('subject, status').eq('status', 'active')

      const counts = {}
      lessonRows?.forEach(l => { counts[l.subject] = (counts[l.subject] ?? 0) + 1 })
      setLessonCounts(counts)

      const seen = new Set()
      const unique = (subjectRows ?? []).filter(s => {
        if (seen.has(s.name)) return false
        seen.add(s.name)
        return true
      })
      setSubjects(unique.slice(0, 8))
      setLoadingSubjects(false)
    }

    async function loadTutors() {
      setTutorsLoading(true)
      const { data } = await supabase
        .from('tutors')
        .select('id, subjects, hourly_rate_kwacha, avg_rating, total_reviews, is_featured, verification_status, badge, profiles(full_name, avatar_url)')
        .eq('is_approved', true)
        .order('is_featured', { ascending: false })
        .order('avg_rating', { ascending: false })
        .limit(4)
      setTutors(data ?? [])
      setTutorsLoading(false)
    }

    loadSubjects()
    loadTutors()

    return () => subscription.unsubscribe()
  }, [])

  const dashboardHref = role === 'tutor' ? '/dashboard/tutor'
    : role === 'admin' ? '/admin'
    : '/dashboard/student'

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="px-6 py-20 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <h1 className="font-serif text-5xl mb-3 leading-tight" style={{ color: 'var(--color-surface-mid)' }}>
          Learn better.<br />
          <span style={{ color: 'var(--color-accent-lit)' }} className="italic">Pass your exams.</span>
        </h1>
        <p className="text-base mb-8 opacity-80" style={{ color: 'var(--color-surface-mid)' }}>
          Zambia&apos;s tutoring platform — built for O-Level and A-Level students.
        </p>

        <div className="flex flex-col items-center gap-3">
          {user ? (
            roleLoading ? (
              <div className="h-10 w-48 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
            ) : (
              <Link href={dashboardHref}
                className="text-sm font-medium px-8 py-3 rounded-xl transition"
                style={{ backgroundColor: '#e8c84a', color: '#1a2a00' }}>
                Go to your dashboard →
              </Link>
            )
          ) : (
            <>
              <Link href="/auth/register"
                className="text-sm font-medium px-8 py-3 rounded-xl transition"
                style={{ backgroundColor: '#e8c84a', color: '#1a2a00' }}>
                Create a free account →
              </Link>
              <p className="text-xs" style={{ color: 'var(--color-surface)', opacity: 0.7 }}>
                Already a member?{' '}
                <Link href="/auth/login" style={{ color: 'var(--color-accent-lit)', borderBottom: '1px solid rgba(201,184,122,0.4)' }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </section>

      {/* Subjects */}
      <section className="px-6 py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="font-serif text-2xl">Browse by subject</h2>
            <Link href="/browse" className="text-sm hover:underline" style={{ color: 'var(--color-primary-lit)' }}>View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {loadingSubjects
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 animate-pulse h-24" />
                ))
              : subjects.map((s) => {
                  const meta  = getMeta(s.name)
                  const count = lessonCounts[s.name] ?? 0
                  return (
                    <Link key={s.id} href={`/browse/${encodeURIComponent(s.name)}`}
                      className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:border-gray-300 hover:shadow-sm transition">
                      <div className={`w-9 h-9 ${meta.bg} ${meta.text} rounded-lg flex items-center justify-center text-xs font-medium mx-auto mb-2`}>
                        {meta.initials}
                      </div>
                      <div className="text-xs font-medium text-gray-800">{s.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {count > 0 ? `${count} lesson${count !== 1 ? 's' : ''}` : 'Coming soon'}
                      </div>
                    </Link>
                  )
                })
            }
          </div>
        </div>
      </section>

      {/* Browse Tutors */}
      <section className="px-6 py-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="font-serif text-2xl">Browse tutors</h2>
            <Link href="/tutor" className="text-sm hover:underline" style={{ color: 'var(--color-primary-lit)' }}>See all →</Link>
          </div>

          {tutorsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse h-44" />
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl">
              <p className="text-sm text-gray-400 mb-3">No tutors available yet.</p>
              <Link href="/auth/register"
                className="text-xs px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                Become the first tutor
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tutors.map((t) => {
                const name = t.profiles?.full_name ?? 'Tutor'
                const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <Link key={t.id} href={`/tutor/${t.id}`}
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition block">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium mb-3"
                      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                      {initials}
                    </div>
                    <div className="text-sm font-medium mb-1">{name}</div>
                    <div className="text-xs text-gray-500 mb-2">{(t.subjects ?? []).slice(0, 2).join(' · ')}</div>
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
                        K{t.hourly_rate_kwacha}/session
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-14 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl mb-10">How it works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: '1', title: 'Browse & choose',       desc: 'Search by subject, grade, or tutor name' },
              { n: '2', title: 'Buy or book',            desc: 'Unlock recorded lessons or book a live session' },
              { n: '3', title: 'Pay with mobile money',  desc: 'Secure checkout via Airtel or MTN Money' },
              { n: '4', title: 'Learn & pass',           desc: 'Study at your own pace and track progress' },
            ].map((s) => (
              <div key={s.n}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg mx-auto mb-3"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                  {s.n}
                </div>
                <div className="text-sm font-medium mb-1">{s.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — stacks on mobile */}
      <footer className="bg-white border-t border-gray-200 px-6 py-5 text-sm text-gray-400">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <span className="font-serif" style={{ color: 'var(--color-primary-lit)' }}>Rent a Tutor · Zambia</span>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link href="/about" className="hover:text-gray-600">About</Link>
            <Link href="/auth/register" className="hover:text-gray-600">Become a tutor</Link>
            <Link href="/contact" className="hover:text-gray-600">Contact</Link>
          </div>
          <span>© 2026 Rent a Tutor</span>
        </div>
      </footer>
    </div>
  )
}
