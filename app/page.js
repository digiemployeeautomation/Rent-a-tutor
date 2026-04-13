// app/page.js
'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { BADGE_LABELS, SUBJECT_ICONS } from '@/lib/constants'
import { StarRating } from '@/components/ui/star-rating'
import { FadeIn } from '@/components/ui/fade-in'
import { EmptyState } from '@/components/ui/empty-state'

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
  return subjectMeta[name] ?? { initials: (name ?? '???').slice(0, 3), bg: 'bg-gray-100', text: 'text-gray-700' }
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
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

  const [scrollY, setScrollY]               = useState(0)
  const heroRef                             = useRef(null)

  useEffect(() => {
    function handleScroll() {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const COLLAPSE_DISTANCE = 280
  const progress = clamp(scrollY / COLLAPSE_DISTANCE, 0, 1)
  const heroPaddingV = Math.round(96 * (1 - progress))
  const heroOpacity  = clamp(1 - progress * 2, 0, 1)
  const heroTranslateY = Math.round(-20 * progress)

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
        .from('lessons').select('subject, status').eq('status', 'active').or('flagged.is.null,flagged.eq.false')

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
        .select('id, subjects, hourly_rate_kwacha, avg_rating, total_reviews, is_featured, verification_status, badge, profiles!user_id(full_name, avatar_url)')
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

      {/* Hero — collapses on scroll */}
      <section
        ref={heroRef}
        className="text-center hero-pattern relative overflow-hidden"
        style={{
          backgroundColor: 'var(--color-primary)',
          paddingTop:    heroPaddingV,
          paddingBottom: heroPaddingV,
          paddingLeft:   '1.5rem',
          paddingRight:  '1.5rem',
          transition: scrollY === 0 ? 'padding 300ms ease' : 'none',
          minHeight: progress >= 1 ? 0 : undefined,
        }}
      >
        <div
          style={{
            opacity:   heroOpacity,
            transform: `translateY(${heroTranslateY}px)`,
            transition: scrollY === 0 ? 'opacity 300ms ease, transform 300ms ease' : 'none',
            pointerEvents: heroOpacity === 0 ? 'none' : 'auto',
          }}
        >
          <FadeIn>
            <h1 className="font-serif text-5xl sm:text-6xl mb-4 leading-tight" style={{ color: 'var(--color-surface-mid)' }}>
              Learn better.<br />
              <span style={{ color: 'var(--color-accent-lit)' }} className="italic">Pass your exams.</span>
            </h1>
            <p className="text-base mb-10 opacity-80 max-w-md mx-auto" style={{ color: 'var(--color-surface-mid)' }}>
              Zambia&apos;s tutoring platform — built for O-Level and A-Level students.
            </p>

            <div className="flex flex-col items-center gap-3">
              {user ? (
                roleLoading ? (
                  <div className="h-12 w-52 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
                ) : (
                  <Link href={dashboardHref}
                    className="text-sm font-medium px-10 py-3.5 rounded-xl transition hover:scale-105"
                    style={{ backgroundColor: '#e8c84a', color: '#1a2a00' }}>
                    Go to your dashboard →
                  </Link>
                )
              ) : (
                <>
                  <Link href="/auth/register"
                    className="text-sm font-medium px-10 py-3.5 rounded-xl transition hover:scale-105"
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
          </FadeIn>
        </div>
      </section>

      {/* Subjects */}
      <section className="px-6 py-14 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="flex justify-between items-baseline mb-8">
              <h2 className="font-serif text-2xl">Browse by subject</h2>
              <Link href="/browse" className="text-sm hover:underline" style={{ color: 'var(--color-primary-lit)' }}>View all →</Link>
            </div>
          </FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {loadingSubjects
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 animate-pulse h-24" />
                ))
              : subjects.map((s, i) => {
                  const meta  = getMeta(s.name)
                  const count = lessonCounts[s.name] ?? 0
                  const icon  = SUBJECT_ICONS[s.name] ?? meta.initials
                  return (
                    <FadeIn key={s.id} delay={i * 50}>
                      <Link href={`/browse/${encodeURIComponent(s.name)}`}
                        className="bg-white border border-gray-200 rounded-xl p-3 text-center card-hover block">
                        <div className={`w-10 h-10 ${meta.bg} ${meta.text} rounded-xl flex items-center justify-center text-sm font-medium mx-auto mb-2`}>
                          {icon}
                        </div>
                        <div className="text-xs font-medium text-gray-800">{s.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {count > 0 ? `${count} lesson${count !== 1 ? 's' : ''}` : 'Coming soon'}
                        </div>
                      </Link>
                    </FadeIn>
                  )
                })
            }
          </div>
        </div>
      </section>

      {/* Browse Tutors */}
      <section className="px-6 py-14 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="flex justify-between items-baseline mb-8">
              <h2 className="font-serif text-2xl">Browse tutors</h2>
              <Link href="/tutor" className="text-sm hover:underline" style={{ color: 'var(--color-primary-lit)' }}>See all →</Link>
            </div>
          </FadeIn>

          {tutorsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse h-44" />
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <EmptyState
              type="tutors"
              title="No tutors available yet."
              actionLabel="Become the first tutor"
              actionHref="/auth/register"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tutors.map((t, i) => {
                const name = t.profiles?.full_name ?? 'Tutor'
                const avatar = t.profiles?.avatar_url
                const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
                return (
                  <FadeIn key={t.id} delay={i * 80}>
                    <Link href={`/tutor/${t.id}`}
                      className="border border-gray-200 rounded-xl p-5 card-hover block bg-white">
                      <div className="flex items-center gap-3 mb-3">
                        {avatar ? (
                          <Image src={avatar} alt={name} width={48} height={48}
                            className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{name}</div>
                          <div className="text-xs text-gray-500 truncate">{(t.subjects ?? []).slice(0, 2).join(' · ')}</div>
                        </div>
                      </div>
                      {t.badge && t.badge !== 'none' && (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-3"
                          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                          ✓ {BADGE_LABELS[t.badge] ?? t.badge}
                        </span>
                      )}
                      <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={t.avg_rating ?? 0} size={12} className="text-amber-400" />
                          <span className="text-xs text-gray-400">{t.total_reviews ?? 0}</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-primary-lit)' }}>
                          K{t.hourly_rate_kwacha}
                        </span>
                      </div>
                    </Link>
                  </FadeIn>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <h2 className="font-serif text-2xl mb-12">How it works</h2>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: '1', title: 'Browse & choose',       desc: 'Search by subject, grade, or tutor name' },
              { n: '2', title: 'Buy or book',            desc: 'Unlock recorded lessons or book a live session' },
              { n: '3', title: 'Pay with mobile money',  desc: 'Secure checkout via Airtel or MTN Money' },
              { n: '4', title: 'Learn & pass',           desc: 'Study at your own pace and track progress' },
            ].map((s, i) => (
              <FadeIn key={s.n} delay={i * 100}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-lg mx-auto mb-4"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                  {s.n}
                </div>
                <div className="text-sm font-medium mb-1">{s.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-6 text-sm text-gray-400">
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
