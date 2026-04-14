// app/page.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

const SUBJECTS = [
  { name: 'Mathematics',      icon: '∑',  bg: '#e8f5e9', text: '#2e7d32' },
  { name: 'English Language', icon: '✎',  bg: '#e3f2fd', text: '#1565c0' },
  { name: 'Biology',          icon: '🧬', bg: '#f1f8e9', text: '#388e3c' },
  { name: 'Chemistry',        icon: '⚗',  bg: '#fffde7', text: '#f57f17' },
  { name: 'Physics',          icon: '⚡', bg: '#ede7f6', text: '#4527a0' },
  { name: 'Geography',        icon: '🌍', bg: '#fff3e0', text: '#e65100' },
  { name: 'History',          icon: '📜', bg: '#fce4ec', text: '#880e4f' },
  { name: 'Computer Studies', icon: '💻', bg: '#e8eaf6', text: '#283593' },
  { name: 'Commerce',         icon: '📊', bg: '#fffde7', text: '#f9a825' },
  { name: 'Accounting',       icon: '🧾', bg: '#fce4ec', text: '#ad1457' },
  { name: 'Economics',        icon: '📈', bg: '#fff3e0', text: '#bf360c' },
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
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Term',
    price: 'K150',
    period: '/term',
    desc: 'All subjects for one term',
    features: ['All 11 subjects', 'Term exams', 'Leaderboard & XP', 'Priority support'],
    cta: 'Most popular',
    highlight: true,
  },
  {
    name: 'Form',
    price: 'K300',
    period: '/form year',
    desc: 'Full year — best value',
    features: ['Everything in Term', 'Full year access', 'Achievement badges', 'Study planner'],
    cta: 'Best value',
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
    <div className="min-h-screen">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <h1 className="font-serif text-5xl mb-3 leading-tight" style={{ color: 'var(--color-surface-mid)' }}>
          Learn smarter with<br />
          <span style={{ color: 'var(--color-accent-lit)' }} className="italic">Zambia&apos;s curriculum.</span>
        </h1>
        <p className="text-base mb-8 opacity-80 max-w-lg mx-auto" style={{ color: 'var(--color-surface-mid)' }}>
          Structured video lessons, topic quizzes, and progress tracking — all built around the ECZ O-Level and A-Level syllabus.
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

      {/* ── Subjects ──────────────────────────────────────────────── */}
      <section className="px-6 py-14 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-2xl mb-2 text-center">11 subjects covered</h2>
          <p className="text-sm text-gray-500 text-center mb-8">All aligned with the ECZ syllabus</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {SUBJECTS.map((s) => (
              <div key={s.name}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-gray-300 hover:shadow-sm transition">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mx-auto mb-2"
                  style={{ backgroundColor: s.bg, color: s.text }}
                >
                  {s.icon}
                </div>
                <div className="text-xs font-medium text-gray-800 leading-tight">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="bg-white px-6 py-14 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl mb-10">How it works</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {HOW_IT_WORKS.map((s) => (
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

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl mb-2 text-center">Simple pricing</h2>
          <p className="text-sm text-gray-500 text-center mb-10">Pay via Airtel Money or MTN Money — no credit card needed</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div key={p.name}
                className="rounded-2xl p-6 border"
                style={{
                  backgroundColor: p.highlight ? 'var(--color-primary)' : '#ffffff',
                  borderColor: p.highlight ? 'transparent' : '#e5e7eb',
                }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: p.highlight ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
                  {p.name}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-serif text-3xl font-bold"
                    style={{ color: p.highlight ? '#e8c84a' : 'var(--color-primary)' }}>
                    {p.price}
                  </span>
                  <span className="text-xs" style={{ color: p.highlight ? 'rgba(255,255,255,0.6)' : '#9ca3af' }}>
                    {p.period}
                  </span>
                </div>
                <p className="text-xs mb-4" style={{ color: p.highlight ? 'rgba(255,255,255,0.75)' : '#6b7280' }}>
                  {p.desc}
                </p>
                <ul className="space-y-1 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="text-xs flex items-start gap-2"
                      style={{ color: p.highlight ? 'rgba(255,255,255,0.85)' : '#374151' }}>
                      <span style={{ color: p.highlight ? '#e8c84a' : 'var(--color-primary-mid)' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register"
                  className="block text-center text-xs font-medium px-4 py-2.5 rounded-xl transition"
                  style={{
                    backgroundColor: p.highlight ? '#e8c84a' : 'var(--color-primary)',
                    color: p.highlight ? '#1a2a00' : '#ffffff',
                  }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 py-16 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <h2 className="font-serif text-3xl mb-3" style={{ color: 'var(--color-surface-mid)' }}>
          Ready to start learning?
        </h2>
        <p className="text-sm mb-8 opacity-75" style={{ color: 'var(--color-surface-mid)' }}>
          Join thousands of Zambian students studying smarter.
        </p>
        <Link href="/auth/register"
          className="inline-block text-sm font-medium px-10 py-3 rounded-xl transition"
          style={{ backgroundColor: '#e8c84a', color: '#1a2a00' }}>
          Sign up free →
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 px-6 py-5 text-sm text-gray-400">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <span className="font-serif" style={{ color: 'var(--color-primary-lit)' }}>Rent a Tutor · Zambia</span>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link href="/about" className="hover:text-gray-600">About</Link>
            <Link href="/contact" className="hover:text-gray-600">Contact</Link>
          </div>
          <span>© 2026 Rent a Tutor</span>
        </div>
      </footer>
    </div>
  )
}
