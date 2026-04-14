// app/learn/[formId]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

const TERM_ICONS = { 1: '🌱', 2: '☀️', 3: '🍂' }

export default function FormPage() {
  const { formId } = useParams()

  const [form, setForm]       = useState(null)
  const [terms, setTerms]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!formId) return
    async function load() {
      const [{ data: formData }, { data: termData }] = await Promise.all([
        supabase.from('forms').select('id, level, name').eq('id', formId).single(),
        supabase.from('terms').select('id, number, name').eq('form_id', formId).order('number', { ascending: true }),
      ])
      setForm(formData)
      setTerms(termData ?? [])
      setLoading(false)
    }
    load()
  }, [formId])

  const formLabel = form ? form.name : 'Form'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Header */}
      <div className="px-4 sm:px-6 py-10" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs mb-4 opacity-60" style={{ color: 'var(--color-surface-mid)' }}>
            <Link href="/learn" className="hover:opacity-100">Learn</Link>
            <span>›</span>
            <span>{formLabel}</span>
          </nav>
          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--color-surface-mid)' }}>
            {loading ? 'Loading...' : `${formLabel} — Choose a term`}
          </h1>
          <p className="text-sm opacity-70" style={{ color: 'var(--color-surface-mid)' }}>
            Select the term you are studying to see available subjects.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-36 animate-pulse" />
            ))}
          </div>
        ) : terms.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No terms found for this form.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {terms.map(term => (
              <Link
                key={term.id}
                href={`/learn/${formId}/${term.id}`}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-md transition flex flex-col items-center text-center"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  {TERM_ICONS[term.number] ?? '📚'}
                </div>
                <h2
                  className="font-serif text-lg font-semibold mb-1"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {term.name}
                </h2>
                <p className="text-xs text-gray-500">Term {term.number}</p>
                <span
                  className="mt-4 text-xs font-medium px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
                >
                  Select →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
