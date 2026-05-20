// app/page.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { supabase } from '@/lib/supabase'

const HOW_IT_WORKS = [
  { n: '1', title: 'Sign up',           desc: 'Create your free account in under a minute' },
  { n: '2', title: 'Tell us your goal', desc: 'Your target band, test date, and weakest section' },
  { n: '3', title: 'Take a placement',  desc: 'Short diagnostic in all four sections' },
  { n: '4', title: 'Practice with AI',  desc: 'Get instant band-score feedback on Writing & Speaking' },
  { n: '5', title: 'Track your band',   desc: 'See your estimated band rise as you practice' },
]

const SECTION_HIGHLIGHTS = [
  { name: 'Listening', icon: '🎧', desc: 'Multi-accent audio practice with instant scoring' },
  { name: 'Reading',   icon: '📖', desc: 'Academic & General passages with every question type' },
  { name: 'Writing',   icon: '✎',  desc: 'AI-graded Task 1 and Task 2 in seconds' },
  { name: 'Speaking',  icon: '🎙', desc: 'Record answers; get fluency, lexical & grammar feedback' },
]

export default function HomePage() {
  const [user, setUser]           = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      setRoleLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setRoleLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-24 text-center">
        <ScrollReveal>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Hit your IELTS band.<br />
            <span className="italic text-blue-200">Faster, with AI.</span>
          </h1>
          <p className="text-base text-blue-100 mb-10 max-w-lg mx-auto opacity-90">
            Practice Listening, Reading, Writing, and Speaking with instant band-score feedback from an AI examiner. Built for Academic and General Training.
          </p>

          <div className="flex flex-col items-center gap-3">
            {user ? (
              roleLoading ? (
                <div className="h-12 w-48 rounded-2xl animate-pulse bg-white/20" />
              ) : (
                <Link
                  href="/dashboard/student"
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
                  Start free →
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

      {/* ── Section coverage ─────────────────────────────────────── */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">All four sections covered</h2>
            <p className="text-sm text-gray-500 text-center mb-10">Built for Academic and General Training, every question type</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SECTION_HIGHLIGHTS.map((s, i) => (
              <ScrollReveal key={s.name} delay={i * 60}>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md shadow-sm transition-shadow h-full">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="text-sm font-semibold text-gray-800 mb-1">{s.name}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
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

      {/* ── Why us ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-gray-800 mb-10 text-center">Why students choose us</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ScrollReveal>
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-pink-500 text-2xl mb-2">⚡</div>
                <div className="text-sm font-semibold text-gray-800 mb-1">Instant feedback</div>
                <div className="text-xs text-gray-500 leading-relaxed">Writing and Speaking grades back in under a minute. No waiting for a tutor.</div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-blue-500 text-2xl mb-2">🎯</div>
                <div className="text-sm font-semibold text-gray-800 mb-1">Per-criterion scoring</div>
                <div className="text-xs text-gray-500 leading-relaxed">Task Response, Coherence, Lexical, Grammar — see exactly where to improve.</div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-blue-500 text-2xl mb-2">📈</div>
                <div className="text-sm font-semibold text-gray-800 mb-1">Personalized plan</div>
                <div className="text-xs text-gray-500 leading-relaxed">Daily study plan tuned to your weak areas, your target band, and your test date.</div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────── */}
      <section className="bg-blue-600 px-6 py-16 text-center">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-white mb-3">
            Start preparing today
          </h2>
          <p className="text-sm text-blue-200 mb-8">
            Free placement diagnostic. No credit card.
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold px-10 py-3 rounded-2xl transition-colors"
          >
            Sign up free →
          </Link>
        </ScrollReveal>
      </section>
    </div>
  )
}
