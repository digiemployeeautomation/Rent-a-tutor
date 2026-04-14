// app/learn/[formId]/[termId]/[subjectSlug]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

function TopicBadge({ lessonCount, isLocked, completedCount }) {
  if (isLocked) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-400">
        Locked
      </span>
    )
  }
  if (lessonCount === 0) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-400">
        Coming soon
      </span>
    )
  }
  if (completedCount >= lessonCount) {
    return (
      <span
        className="text-xs px-2.5 py-1 rounded-full font-medium"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)' }}
      >
        Completed
      </span>
    )
  }
  if (completedCount > 0) {
    return (
      <span
        className="text-xs px-2.5 py-1 rounded-full font-medium"
        style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-accent)' }}
      >
        Continue
      </span>
    )
  }
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
    >
      Start
    </span>
  )
}

export default function SubjectPage() {
  const { formId, termId, subjectSlug } = useParams()

  const [form, setForm]         = useState(null)
  const [term, setTerm]         = useState(null)
  const [subject, setSubject]   = useState(null)
  const [units, setUnits]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [studentId, setStudentId] = useState(null)

  useEffect(() => {
    if (!formId || !termId || !subjectSlug) return

    async function load() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.id ?? null
      setStudentId(sid)

      // Fetch form, term, and subject in parallel
      const [{ data: formData }, { data: termData }, { data: subjectData }] = await Promise.all([
        supabase.from('forms').select('id, level, name').eq('id', formId).single(),
        supabase.from('terms').select('id, number, name').eq('id', termId).single(),
        supabase.from('subjects_new').select('id, name, slug, description, icon').eq('slug', subjectSlug).single(),
      ])

      setForm(formData)
      setTerm(termData)
      setSubject(subjectData)

      if (!subjectData) {
        setLoading(false)
        return
      }

      // Fetch units for this term + subject
      const { data: unitData } = await supabase
        .from('units')
        .select('id, number, title, description')
        .eq('term_id', termId)
        .eq('subject_id', subjectData.id)
        .order('number', { ascending: true })

      const unitList = unitData ?? []

      // For each unit, fetch topics and lesson counts + progress
      const enriched = await Promise.all(
        unitList.map(async (unit, unitIndex) => {
          // Fetch topics for this unit
          const { data: topicData } = await supabase
            .from('topics')
            .select('id, title, description, order')
            .eq('unit_id', unit.id)
            .order('order', { ascending: true })

          const topicList = topicData ?? []

          // For each topic, count lessons and completed lessons
          const enrichedTopics = await Promise.all(
            topicList.map(async topic => {
              // Count published lessons for this topic
              const { count: lessonCount } = await supabase
                .from('lessons_new')
                .select('id', { count: 'exact', head: true })
                .eq('topic_id', topic.id)
                .eq('status', 'published')

              // Count completed lessons for this student
              let completedCount = 0
              if (sid) {
                // Get all lesson IDs for this topic first
                const { data: lessonIds } = await supabase
                  .from('lessons_new')
                  .select('id')
                  .eq('topic_id', topic.id)
                  .eq('status', 'published')

                if (lessonIds && lessonIds.length > 0) {
                  const ids = lessonIds.map(l => l.id)
                  const { count: progCount } = await supabase
                    .from('student_progress')
                    .select('lesson_id', { count: 'exact', head: true })
                    .eq('student_id', sid)
                    .in('lesson_id', ids)
                  completedCount = progCount ?? 0
                }
              }

              return {
                ...topic,
                lessonCount:    lessonCount ?? 0,
                completedCount,
              }
            })
          )

          // Determine if this unit is locked
          // Unit 1 is always unlocked. Unit N is locked if any topic in unit N-1 has incomplete lessons.
          let isUnitLocked = false
          if (unitIndex > 0) {
            // For simplicity in v1: unit is locked unless unit 1 has content progress
            // We check if the previous unit has any topics with lessons to complete
            // and whether they are all done
            isUnitLocked = true // locked by default for units > 1 in v1
          }

          return {
            ...unit,
            topics: enrichedTopics,
            isLocked: isUnitLocked,
          }
        })
      )

      setUnits(enriched)
      setLoading(false)
    }
    load()
  }, [formId, termId, subjectSlug])

  const formLabel    = form    ? form.name    : 'Form'
  const termLabel    = term    ? term.name    : 'Term'
  const subjectLabel = subject ? subject.name : 'Subject'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Header */}
      <div className="px-4 sm:px-6 py-10" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs mb-4 opacity-60 flex-wrap" style={{ color: 'var(--color-surface-mid)' }}>
            <Link href="/learn" className="hover:opacity-100">Learn</Link>
            <span>›</span>
            <Link href={`/learn/${formId}`} className="hover:opacity-100">{formLabel}</Link>
            <span>›</span>
            <Link href={`/learn/${formId}/${termId}`} className="hover:opacity-100">{termLabel}</Link>
            <span>›</span>
            <span>{subjectLabel}</span>
          </nav>
          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--color-surface-mid)' }}>
            {loading ? 'Loading...' : subjectLabel}
          </h1>
          {subject?.description && (
            <p className="text-sm opacity-70 max-w-xl" style={{ color: 'var(--color-surface-mid)' }}>
              {subject.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-40 animate-pulse" />
            ))}
          </div>
        ) : !subject ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400 mb-2">Subject not found.</p>
            <Link href={`/learn/${formId}/${termId}`}
              className="text-xs underline"
              style={{ color: 'var(--color-primary-lit)' }}>
              Back to subjects
            </Link>
          </div>
        ) : units.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm text-gray-400 mb-1">No units available yet.</p>
            <p className="text-xs text-gray-300">Check back soon — content is being added.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {units.map((unit, unitIndex) => (
              <div
                key={unit.id}
                className="bg-white border rounded-2xl overflow-hidden"
                style={{ borderColor: unit.isLocked ? '#e5e7eb' : 'var(--color-surface)' }}
              >
                {/* Unit header */}
                <div
                  className="px-6 py-4 flex items-start justify-between"
                  style={{ backgroundColor: unit.isLocked ? '#f9fafb' : 'var(--color-surface)' }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={unit.isLocked
                          ? { backgroundColor: '#e5e7eb', color: '#9ca3af' }
                          : { backgroundColor: 'var(--color-primary)', color: 'var(--color-surface-mid)' }}
                      >
                        Unit {unit.number}
                      </span>
                      {unit.isLocked && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                    <h2
                      className="font-serif text-lg font-semibold"
                      style={{ color: unit.isLocked ? '#9ca3af' : 'var(--color-primary)' }}
                    >
                      {unit.title}
                    </h2>
                    {unit.description && (
                      <p className="text-sm mt-0.5" style={{ color: unit.isLocked ? '#d1d5db' : '#6b7280' }}>
                        {unit.description}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-4"
                    style={unit.isLocked
                      ? { backgroundColor: '#e5e7eb', color: '#9ca3af' }
                      : { backgroundColor: 'var(--color-badge-bg)', color: 'var(--color-badge-text)' }}
                  >
                    {unit.topics.length} topic{unit.topics.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Topics list */}
                {unit.topics.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {unit.topics.map((topic, topicIndex) => {
                      const isTopicLocked = unit.isLocked
                      const href = `/learn/${formId}/${termId}/${subjectSlug}/${topic.id}`

                      const topicRow = (
                        <div className="px-6 py-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                              style={isTopicLocked
                                ? { backgroundColor: '#f3f4f6', color: '#9ca3af' }
                                : { backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}
                            >
                              {topicIndex + 1}
                            </span>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: isTopicLocked ? '#9ca3af' : '#111827' }}
                              >
                                {topic.title}
                              </p>
                              {topic.lessonCount > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {topic.lessonCount} lesson{topic.lessonCount !== 1 ? 's' : ''}
                                  {topic.completedCount > 0 && ` · ${topic.completedCount} completed`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <TopicBadge
                              lessonCount={topic.lessonCount}
                              isLocked={isTopicLocked}
                              completedCount={topic.completedCount}
                            />
                          </div>
                        </div>
                      )

                      if (isTopicLocked || topic.lessonCount === 0) {
                        return <div key={topic.id}>{topicRow}</div>
                      }

                      return (
                        <Link
                          key={topic.id}
                          href={href}
                          className="block hover:bg-gray-50 transition"
                        >
                          {topicRow}
                        </Link>
                      )
                    })}
                  </div>
                )}

                {unit.topics.length === 0 && (
                  <div className="px-6 py-4 text-sm text-gray-400">
                    No topics available yet.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
