'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

const BUNDLES = [
  {
    id: 'form4-core',
    title: 'Form 4 Core Bundle',
    level: 'O-Level · Form 4',
    subjects: ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics'],
    price: 450,
    originalPrice: 600,
    description: 'Everything you need to pass your Form 4 exams. Includes all core science and language lessons with exam-focused practice.',
    highlight: 'Most popular',
    color: 'var(--color-primary)',
    colorLight: 'var(--color-surface)',
  },
  {
    id: 'form4-science',
    title: 'Form 4 Science Pack',
    level: 'O-Level · Form 4',
    subjects: ['Biology', 'Chemistry', 'Physics'],
    price: 300,
    originalPrice: 400,
    description: 'Deep-dive into all three sciences with exam-style questions and detailed marking guides.',
    highlight: null,
    color: 'var(--color-primary-mid)',
    colorLight: 'var(--color-surface)',
  },
  {
    id: 'form4-commercial',
    title: 'Form 4 Commerce Pack',
    level: 'O-Level · Form 4',
    subjects: ['Commerce', 'Principles of Accounts', 'Economics'],
    price: 280,
    originalPrice: 380,
    description: 'Master business subjects with worked examples and past paper walk-throughs.',
    highlight: null,
    color: 'var(--color-primary-mid)',
    colorLight: 'var(--color-surface)',
  },
  {
    id: 'form6-core',
    title: 'Form 6 A-Level Bundle',
    level: 'A-Level · Form 6',
    subjects: ['Further Mathematics', 'Chemistry', 'Physics', 'Economics'],
    price: 500,
    originalPrice: 700,
    description: 'Comprehensive A-Level preparation across core subjects. University entrance ready.',
    highlight: 'Best value',
    color: 'var(--color-accent)',
    colorLight: 'var(--color-highlight)',
  },
  {
    id: 'maths-only',
    title: 'Mathematics Masterclass',
    level: 'Forms 1–6',
    subjects: ['Mathematics', 'Additional Mathematics', 'Further Mathematics'],
    price: 200,
    originalPrice: 280,
    description: 'Build from Form 1 foundations all the way to A-Level Further Maths. Perfect for students who want to get ahead.',
    highlight: null,
    color: 'var(--color-primary-mid)',
    colorLight: 'var(--color-surface)',
  },
]

export default function ExamPrepPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u))
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Header */}
      <div className="px-6 py-14 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link href="/" className="text-xs mb-6 inline-block opacity-60 hover:opacity-100"
          style={{ color: 'var(--color-surface-mid)' }}>
          ← Back to home
        </Link>
        <h1 className="font-serif text-4xl mb-3" style={{ color: 'var(--color-surface-mid)' }}>
          Exam preparation bundles
        </h1>
        <p className="text-base mb-2 opacity-80 max-w-xl mx-auto" style={{ color: 'var(--color-surface-mid)' }}>
          Save on grouped lesson packs built around ECZ exam syllabuses.
          One payment, lifetime access.
        </p>
        <p className="text-sm opacity-60" style={{ color: 'var(--color-surface-mid)' }}>
          All bundles include past-paper walkthroughs and marking guides.
        </p>
      </div>

      {/* How bundles work */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 text-center">
          {[
            { icon: '📦', label: 'Choose a bundle' },
            { icon: '💸', label: 'Pay once via mobile money' },
            { icon: '♾️',  label: 'Lifetime access' },
            { icon: '📈', label: 'Study & pass' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">{s.icon}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Bundles grid */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BUNDLES.map(bundle => (
            <div key={bundle.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition flex flex-col">

              {/* Card header */}
              <div className="px-5 pt-5 pb-4" style={{ backgroundColor: bundle.colorLight }}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-gray-500">{bundle.level}</span>
                  {bundle.highlight && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ backgroundColor: bundle.color, color: '#fff' }}>
                      {bundle.highlight}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg leading-snug" style={{ color: 'var(--color-primary)' }}>
                  {bundle.title}
                </h3>
              </div>

              {/* Body */}
              <div className="px-5 py-4 flex-1 flex flex-col">
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{bundle.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {bundle.subjects.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-600">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-serif text-2xl" style={{ color: 'var(--color-primary)' }}>
                      K{bundle.price}
                    </span>
                    <span className="text-sm text-gray-400 line-through">K{bundle.originalPrice}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-accent)' }}>
                      Save K{bundle.originalPrice - bundle.price}
                    </span>
                  </div>

                  {user ? (
                    <button
                      onClick={() => alert('Bundle purchasing coming soon! Each lesson is available individually in Browse.')}
                      className="w-full py-2.5 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}>
                      Buy bundle — K{bundle.price}
                    </button>
                  ) : (
                    <Link
                      href="/auth/register"
                      className="block w-full py-2.5 rounded-lg text-sm font-medium text-center"
                      style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}>
                      Sign up to buy — K{bundle.price}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom bundle CTA */}
        <div className="mt-10 rounded-2xl px-8 py-8 text-center border border-dashed border-gray-200">
          <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--color-primary)' }}>
            Need a custom bundle?
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Talk to a tutor directly and they can build a personalised lesson plan for your subjects and exam timeline.
          </p>
          <Link href="/tutor"
            className="text-sm px-6 py-2.5 rounded-lg font-medium inline-block"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
            Find a tutor
          </Link>
        </div>
      </div>
    </div>
  )
}
