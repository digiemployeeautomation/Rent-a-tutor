// app/learn/[formId]/[termId]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { hasAccess } from '@/lib/subscription'

export default function TermPage() {
  const { formId, termId } = useParams()

  const [form, setForm]           = useState(null)
  const [term, setTerm]           = useState(null)
  const [subjects, setSubjects]   = useState([])
  const [unitCounts, setUnitCounts] = useState({})
  const [accessMap, setAccessMap] = useState({})
  const [loading, setLoading]     = useState(true)
  const [studentId, setStudentId] = useState(null)

  useEffect(() => {
    if (!formId || !termId) return

    async function load() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.id ?? null
      setStudentId(sid)

      // Fetch form, term, and all subjects in parallel
      const [{ data: formData }, { data: termData }, { data: subjectData }] = await Promise.all([
        supabase.from('forms').select('id, level, name').eq('id', formId).single(),
        supabase.from('terms').select('id, number, name').eq('id', termId).single(),
        supabase.from('subjects_new').select('id, name, slug, description, icon').order('name', { ascending: true }),
      ])

      setForm(formData)
      setTerm(termData)
      const subs = subjectData ?? []
      setSubjects(subs)

      // For each subject, count units for this term
      const counts = {}
      await Promise.all(
        subs.map(async subject => {
          const { count } = await supabase
            .from('units')
            .select('id', { count: 'exact', head: true })
            .eq('term_id', termId)
            .eq('subject_id', subject.id)
          counts[subject.id] = count ?? 0
        })
      )
      setUnitCounts(counts)

      // Check access for each subject if logged in
      if (sid) {
        const access = {}
        await Promise.all(
          subs.map(async subject => {
            access[subject.id] = await hasAccess(supabase, sid, {
              subjectId: subject.id,
              formId,
              termId,
            })
          })
        )
        setAccessMap(access)
      }

      setLoading(false)
    }
    load()
  }, [formId, termId])

  const formLabel    = form ? form.name : 'Form'
  const termLabel    = term ? term.name : 'Term'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Header */}
      <div className="px-4 sm:px-6 py-10" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs mb-4 opacity-60" style={{ color: 'var(--color-surface-mid)' }}>
            <Link href="/learn" className="hover:opacity-100">Learn</Link>
            <span>›</span>
            <Link href={`/learn/${formId}`} className="hover:opacity-100">{formLabel}</Link>
            <span>›</span>
            <span>{termLabel}</span>
          </nav>
          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--color-surface-mid)' }}>
            {loading ? 'Loading...' : `${formLabel}, ${termLabel} — Subjects`}
          </h1>
          <p className="text-sm opacity-70" style={{ color: 'var(--color-surface-mid)' }}>
            Choose a subject to start learning.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-40 animate-pulse" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No subjects found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects.map(subject => {
              const count       = unitCounts[subject.id] ?? 0
              const hasContent  = count > 0
              const subscribed  = studentId ? (accessMap[subject.id] ?? false) : false
              const showLock    = studentId && hasContent && !subscribed

              const cardContent = (
                <>
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                    style={{ backgroundColor: hasContent ? 'var(--color-surface)' : '#f3f4f6' }}
                  >
                    {subject.icon ?? '📖'}
                  </div>

                  <h2
                    className="font-semibold text-sm mb-1 leading-snug"
                    style={{ color: hasContent ? 'var(--color-primary)' : '#9ca3af' }}
                  >
                    {subject.name}
                  </h2>

                  {subject.description && (
                    <p className="text-xs mb-2 line-clamp-2" style={{ color: hasContent ? '#6b7280' : '#d1d5db' }}>
                      {subject.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={hasContent
                        ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }
                        : { backgroundColor: '#f3f4f6', color: '#9ca3af' }}
                    >
                      {hasContent ? `${count} unit${count !== 1 ? 's' : ''}` : 'Coming soon'}
                    </span>
                    {showLock && (
                      <span className="text-gray-400 text-sm" title="Subscription required">🔒</span>
                    )}
                  </div>
                </>
              )

              if (!hasContent) {
                return (
                  <div
                    key={subject.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col opacity-60 cursor-not-allowed"
                  >
                    {cardContent}
                  </div>
                )
              }

              return (
                <Link
                  key={subject.id}
                  href={`/learn/${formId}/${termId}/${subject.slug}`}
                  className="group bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-300 hover:shadow-md transition flex flex-col"
                >
                  {cardContent}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
