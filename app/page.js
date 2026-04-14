// app/page.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { supabase } from '@/lib/supabase'

const SUBJECTS = [
  { name: 'Mathematics',      icon: '∑'  },
  { name: 'English Language', icon: '✎'  },
  { name: 'Biology',          icon: '🧬' },
  { name: 'Chemistry',        icon: '⚗'  },
  { name: 'Physics',          icon: '⚡' },
  { name: 'Geography',        icon: '🌍' },
  { name: 'History',          icon: '📜' },
  { name: 'Computer Studies', icon: '💻' },
  { name: 'Commerce',         icon: '📊' },
  { name: 'Accounting',       icon: '🧾' },
  { name: 'Economics',        icon: '📈' },
]

const HOW_IT_WORKS = [
  { n: '1', title: 'Sign up',                desc: 'Create your free account in under a minute' },
  { n: '2', title: 'Choose your subjects',   desc: 'Pick the ECZ subjects you are studying' },
  { n: '3', title: 'Learn with videos & slides', desc: 'Work through structured lessons at your own pace' },
  { n: '4', title: 'Quiz yourself',          desc: 'Test your knowledge after each topic' },
  { n: '5', title: 'Track your progress',    desc: 'See your XP, streak and leaderboard rank grow' },
]

const PLANS = [
  {
    name: 'Subject',
    price: 'K50',
    period: '/month',
    desc: 'Full access to one subject',
    features: ['All lessons for 1 subject', 'Topic quizzes', 'Progress tracking'],
    highlight: false,
  },
  {
    name: 'Term',
    price: 'K150',
    period: '/term',
    desc: 'All subjects for one term',
    features: ['All 11 subjects', 'Term exams', 'Leaderboard & XP', 'Priority support'],
    highlight: true,
  },
  {
    name: 'Form',
    price: 'K300',
    period: '/form year',
    desc: 'Full year — best value',
    features: ['Everything in Term', 'Full year access', 'Achievement badges', 'Study planner'],
    highlight: false,
  },
]

export default function HomePage() {
  const [user, setUser]           = useState(null)
  const [role, setRole]           = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

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

    return () => subscription.unsubscribe()
  }, [])

  const dashboardHref = role === 'admin' ? '/admin' : '/dashboard/student'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-24 text-center">
        <ScrollReveal>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Learn smarter with<br />
            <span className="italic text-blue-200">Zambia&apos;s curriculum.</span>
          </h1>
          <p className="text-base text-blue-100 mb-10 max-w-lg mx-auto opacity-90">
            Structured video lessons, topic quizzes, and progress tracking — all built around the ECZ O-Level and A-Level syllabus.
          </p>

          <div className="flex flex-col items-center gap-3">
            {user ? (
              roleLoading ? (
                <div className="h-12 w-48 rounded-2xl animate-pulse bg-white/20" />
              ) : (
                <Link
                  href={dashboardHref}
                  className="inline-block bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold px-8 py-3 rounded-2xl transition-colors"
                >
                  Go to your dashboard →
                </Link>
              )
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="inline-block bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold px-8 py-3 rounded-2xl transition-colors"
                >
                  Get Started →
                </Link>
                <p className="text-xs text-blue-200">
                  Already a member?{' '}
                  <Link href="/auth/login" className="text-white underline underline-offset-2 hover:text-blue-100">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* ── Subjects ──────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">11 subjects covered</h2>
            <p className="text-sm text-gray-500 text-center mb-10">All aligned with the ECZ syllabus</p>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {SUBJECTS.map((s, i) => (
              <ScrollReveal key={s.name} delay={i * 40}>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center hover:shadow-md shadow-sm transition-shadow">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="text-sm font-medium text-gray-800 leading-tight">{s.name}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-gray-800 mb-12 text-center">How it works</h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {HOW_IT_WORKS.map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 80} className="text-center">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-3">
                    {s.n}
                  </div>
                  {/* Connector line — desktop only, between steps */}
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-4 left-1/2 w-full h-px bg-gray-200 -z-10" />
                  )}
                </div>
                <div className="text-sm font-semibold text-gray-800 mb-1">{s.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Simple pricing</h2>
            <p className="text-sm text-gray-500 text-center mb-10">Pay via Airtel Money or MTN Money — no credit card needed</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map((p, i) => (
              <ScrollReveal key={p.name} delay={i * 80}>
                <div className={`relative rounded-2xl p-6 bg-white shadow-sm border ${
                  p.highlight ? 'border-blue-400 shadow-md' : 'border-gray-200'
                }`}>
                  {p.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                    {p.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-blue-600">{p.price}</span>
                    <span className="text-xs text-gray-400">{p.period}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{p.desc}</p>
                  <ul className="space-y-1.5 mb-6">
                    {p.features.map(f => (
                      <li key={f} className="text-xs text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 font-bold mt-px">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/register"
                    className="block text-center text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Subscribe
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────── */}
      <section className="bg-blue-600 px-6 py-16 text-center">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-white mb-3">
            Start learning today
          </h2>
          <p className="text-sm text-blue-200 mb-8">
            Join thousands of Zambian students studying smarter.
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold px-10 py-3 rounded-2xl transition-colors"
          >
            Sign up free →
          </Link>
        </ScrollReveal>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 px-6 py-5 text-sm text-gray-400">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left max-w-5xl mx-auto">
          <span className="font-bold text-blue-600">
            Rent<span className="text-pink-400 italic">a</span>Tutor · Zambia
          </span>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link href="/about" className="hover:text-gray-600 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-gray-600 transition-colors">Contact</Link>
          </div>
          <span>© 2026 RentaTutor</span>
        </div>
      </footer>
    </div>
  )
}
