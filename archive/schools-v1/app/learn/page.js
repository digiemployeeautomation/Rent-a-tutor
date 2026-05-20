// app/learn/page.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import FeedLayout from '@/components/layout/FeedLayout'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs mb-4 text-blue-200 opacity-80">Learn</p>
          <h1 className="font-serif text-4xl mb-2 text-white">Choose your form</h1>
          <p className="text-sm text-blue-100 opacity-80">
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
                className="group bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-800 transition flex flex-col items-center text-center"
              >
                {/* Form number */}
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white mb-4">
                  {form.level}
                </div>
                <h2 className="font-serif text-lg font-semibold mb-1 text-white">
                  {form.name}
                </h2>
                <p className="text-xs text-blue-200">
                  {FORM_DESCRIPTIONS[form.level] ?? 'O-Level'}
                </p>
                <span className="mt-4 text-xs font-medium px-3 py-1 rounded-full bg-white/20 text-white opacity-0 group-hover:opacity-100 transition">
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
