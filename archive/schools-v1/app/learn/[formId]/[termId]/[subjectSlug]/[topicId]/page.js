// app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import FeedLayout from '@/components/layout/FeedLayout'
import { supabase } from '@/lib/supabase'
import { hasAccess } from '@/lib/subscription'
import Paywall from '@/components/lesson/Paywall'

function LessonStatusBadge({ totalSections, completedSections, isComingSoon }) {
  if (isComingSoon) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-400">
        Coming soon
      </span>
    )
  }
  if (totalSections === 0) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-400">
        No content
      </span>
    )
  }
  if (completedSections >= totalSections) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">
        Completed
      </span>
    )
  }
  if (completedSections > 0) {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
        In progress
      </span>
    )
  }
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-500">
      Not started
    </span>
  )
}

export default function TopicPage() {
  const { formId, termId, subjectSlug, topicId } = useParams()

  const [form, setForm]         = useState(null)
  const [term, setTerm]         = useState(null)
  const [subject, setSubject]   = useState(null)
  const [topic, setTopic]       = useState(null)
  const [lessons, setLessons]   = useState([])
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [studentId, setStudentId] = useState(null)

  async function load() {
    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    const sid = user?.id ?? null
    setStudentId(sid)

    // 2. Fetch topic by ID
    const { data: topicData } = await supabase
      .from('topics')
      .select('id, unit_id, title, description')
      .eq('id', topicId)
      .single()

    setTopic(topicData)

    if (!topicData) {
      setLoading(false)
      return
    }

    // 3. Fetch unit → subject, form, term info
    const { data: unitData } = await supabase
      .from('units')
      .select('id, number, title, term_id, subject_id')
      .eq('id', topicData.unit_id)
      .single()

    const [{ data: formData }, { data: termData }, { data: subjectData }] = await Promise.all([
      supabase.from('forms').select('id, level, name').eq('id', formId).single(),
      supabase.from('terms').select('id, number, name').eq('id', termId).single(),
      supabase.from('subjects_new').select('id, name, slug').eq('slug', subjectSlug).single(),
    ])

    setForm(formData)
    setTerm(termData)
    setSubject(subjectData)

    // 4. Check subscription access
    let hasSubscription = false
    if (sid && subjectData && formData && termData) {
      hasSubscription = await hasAccess(supabase, sid, {
        subjectId: subjectData.id,
        formId,
        termId,
      })
    }
    setSubscribed(hasSubscription)

    // 5. Fetch published lessons for this topic, ordered by "order"
    const { data: lessonData } = await supabase
      .from('lessons_new')
      .select('id, title, description, order, status')
      .eq('topic_id', topicId)
      .in('status', ['published', 'coming_soon'])
      .order('order', { ascending: true })

    const lessonList = lessonData ?? []

    // 6. For each lesson, count total sections and completed sections
    const enriched = await Promise.all(
      lessonList.map(async (lesson) => {
        // Count total sections
        const { count: totalSections } = await supabase
          .from('lesson_sections')
          .select('id', { count: 'exact', head: true })
          .eq('lesson_id', lesson.id)

        // Count completed sections for this student
        let completedSections = 0
        if (sid) {
          const { count: compCount } = await supabase
            .from('student_progress')
            .select('section_id', { count: 'exact', head: true })
            .eq('student_id', sid)
            .eq('lesson_id', lesson.id)
          completedSections = compCount ?? 0
        }

        return {
          ...lesson,
          totalSections: totalSections ?? 0,
          completedSections,
        }
      })
    )

    setLessons(enriched)
    setLoading(false)
  }

  useEffect(() => {
    if (!formId || !termId || !subjectSlug || !topicId) return
    load()
  }, [formId, termId, subjectSlug, topicId])

  const formLabel    = form    ? form.name    : 'Form'
  const termLabel    = term    ? term.name    : 'Term'
  const subjectLabel = subject ? subject.name : 'Subject'
  const topicLabel   = topic   ? topic.title  : 'Topic'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs mb-4 text-blue-200 opacity-80 flex-wrap">
            <Link href="/learn" className="hover:opacity-100">Learn</Link>
            <span>›</span>
            <Link href={`/learn/${formId}`} className="hover:opacity-100">{formLabel}</Link>
            <span>›</span>
            <Link href={`/learn/${formId}/${termId}`} className="hover:opacity-100">{termLabel}</Link>
            <span>›</span>
            <Link href={`/learn/${formId}/${termId}/${subjectSlug}`} className="hover:opacity-100">{subjectLabel}</Link>
            <span>›</span>
            <span>{topicLabel}</span>
          </nav>
          <h1 className="font-serif text-4xl mb-2 text-white">
            {loading ? 'Loading...' : topicLabel}
          </h1>
          {topic?.description && (
            <p className="text-sm text-blue-100 opacity-80 max-w-xl">
              {topic.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-28 animate-pulse" />
            ))}
          </div>
        ) : !topic ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400 mb-2">Topic not found.</p>
            <Link href={`/learn/${formId}/${termId}/${subjectSlug}`} className="text-xs underline text-blue-600">
              Back to units
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back to units link */}
            <Link
              href={`/learn/${formId}/${termId}/${subjectSlug}`}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to units
            </Link>

            {/* Paywall or lesson list */}
            {!subscribed && studentId ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Subscribe to access the lessons in this topic.
                  </p>
                </div>
                <Paywall
                  subjectName={subjectLabel}
                  formName={formLabel}
                  termName={termLabel}
                  subjectId={subject?.id}
                  formId={formId}
                  termId={termId}
                  onSubscribed={() => load()}
                />
              </>
            ) : lessons.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                <p className="text-sm text-gray-400 mb-1">No lessons available yet.</p>
                <p className="text-xs text-gray-300">Check back soon — content is being added.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const isComingSoon = lesson.status === 'coming_soon'
                  const href = `/learn/${formId}/${termId}/${subjectSlug}/${topicId}/lesson/${lesson.id}`
                  const progressPct = lesson.totalSections > 0
                    ? Math.round((lesson.completedSections / lesson.totalSections) * 100)
                    : 0

                  const cardInner = (
                    <div
                      className={`bg-white border rounded-2xl shadow-sm p-5 flex flex-col gap-3 transition ${
                        isComingSoon ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Lesson number circle */}
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5 ${
                              isComingSoon ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <h2 className={`text-sm font-semibold leading-snug ${isComingSoon ? 'text-gray-400' : 'text-gray-900'}`}>
                              {lesson.title}
                            </h2>
                            {lesson.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <LessonStatusBadge
                            totalSections={lesson.totalSections}
                            completedSections={lesson.completedSections}
                            isComingSoon={isComingSoon}
                          />
                        </div>
                      </div>

                      {/* Progress bar */}
                      {!isComingSoon && lesson.totalSections > 0 && (
                        <div className="pl-11">
                          <p className="text-xs text-gray-400 mb-1.5">
                            {lesson.completedSections} of {lesson.totalSections} section{lesson.totalSections !== 1 ? 's' : ''} completed
                          </p>
                          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )

                  if (isComingSoon) {
                    return <div key={lesson.id}>{cardInner}</div>
                  }

                  return (
                    <Link key={lesson.id} href={href} className="block">
                      {cardInner}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
