// app/learn/[formId]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import FeedLayout from '@/components/layout/FeedLayout'
import { supabase } from '@/lib/supabase'

const TERM_ICONS = { 1: '🌱', 2: '☀️', 3: '🍂' }
const TERM_BG = ['bg-blue-50', 'bg-blue-100', 'bg-blue-200']

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs mb-4 text-blue-200 opacity-80">
            <Link href="/learn" className="hover:opacity-100">Learn</Link>
            <span>›</span>
            <span>{formLabel}</span>
          </nav>
          <h1 className="font-serif text-4xl mb-2 text-white">
            {loading ? 'Loading...' : `${formLabel} — Choose a term`}
          </h1>
          <p className="text-sm text-blue-100 opacity-80">
            Select the term you are studying to see available subjects.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-36 min-w-[200px] animate-pulse snap-start" />
            ))}
          </div>
        ) : terms.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No terms found for this form.</p>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible">
            {terms.map((term, i) => (
              <Link
                key={term.id}
                href={`/learn/${formId}/${term.id}`}
                className={`group ${TERM_BG[i] ?? 'bg-blue-100'} rounded-2xl shadow-sm p-6 hover:shadow-md transition flex flex-col items-center text-center min-w-[200px] snap-start sm:min-w-0`}
              >
                <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center text-2xl mb-4">
                  {TERM_ICONS[term.number] ?? '📚'}
                </div>
                <h2 className="font-serif text-lg font-semibold mb-1 text-blue-800">
                  {term.name}
                </h2>
                <p className="text-xs text-blue-600">Term {term.number}</p>
                <span className="mt-4 text-xs font-medium px-3 py-1 rounded-full bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition">
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
