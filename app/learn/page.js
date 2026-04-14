// app/learn/page.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

const FORM_DESCRIPTIONS = {
  1: 'O-Level — Year 1',
  2: 'O-Level — Year 2',
  3: 'O-Level — Year 3',
  4: 'O-Level — Year 4',
}

export default function LearnPage() {
  const [forms, setForms]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('forms')
        .select('id, level, name')
        .order('level', { ascending: true })
      setForms(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Header */}
      <div className="px-4 sm:px-6 py-10" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs mb-4 opacity-60" style={{ color: 'var(--color-surface-mid)' }}>
            Learn
          </p>
          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--color-surface-mid)' }}>
            Choose your form
          </h1>
          <p className="text-sm opacity-70" style={{ color: 'var(--color-surface-mid)' }}>
            Select the form you are studying to see the available content.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-36 animate-pulse" />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No forms available yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {forms.map(form => (
              <Link
                key={form.id}
                href={`/learn/${form.id}`}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-md transition flex flex-col items-center text-center"
              >
                {/* Form number badge */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-4"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)' }}
                >
                  {form.level}
                </div>
                <h2
                  className="font-serif text-lg font-semibold mb-1"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {form.name}
                </h2>
                <p className="text-xs text-gray-500">
                  {FORM_DESCRIPTIONS[form.level] ?? 'O-Level'}
                </p>
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
