// app/learn/[formId]/[termId]/[subjectSlug]/topic-test/[topicId]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import FeedLayout from '@/components/layout/FeedLayout'
import { supabase } from '@/lib/supabase'
import QuizPlayer from '@/components/lesson/QuizPlayer'

export default function TopicTestPage() {
  const { formId, termId, subjectSlug, topicId } = useParams()

  const [form, setForm]                 = useState(null)
  const [term, setTerm]                 = useState(null)
  const [subject, setSubject]           = useState(null)
  const [topic, setTopic]               = useState(null)
  const [quiz, setQuiz]                 = useState(null)
  const [questions, setQuestions]       = useState([])
  const [tierConfig, setTierConfig]     = useState(null)
  const [incompleteLessons, setIncompleteLessons] = useState([])
  const [allComplete, setAllComplete]   = useState(false)
  const [quizResult, setQuizResult]     = useState(null) // { score, total, passed, topicUnitId }
  const [allTopicsTested, setAllTopicsTested] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  useEffect(() => {
    if (!formId || !termId || !subjectSlug || !topicId) return
    load()
  }, [formId, termId, subjectSlug, topicId])

  async function load() {
    setLoading(true)
    setError(null)

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    const sid = user?.id ?? null

    // 2. Fetch form, term, subject, topic in parallel
    const [
      { data: formData },
      { data: termData },
      { data: subjectData },
      { data: topicData },
    ] = await Promise.all([
      supabase.from('forms').select('id, level, name').eq('id', formId).single(),
      supabase.from('terms').select('id, number, name').eq('id', termId).single(),
      supabase.from('subjects_new').select('id, name, slug').eq('slug', subjectSlug).single(),
      supabase.from('topics').select('id, unit_id, title').eq('id', topicId).single(),
    ])

    setForm(formData)
    setTerm(termData)
    setSubject(subjectData)
    setTopic(topicData)

    if (!topicData) {
      setError('Topic not found.')
      setLoading(false)
      return
    }

    // 3. Check if all published lessons in this topic are completed
    const { data: publishedLessons } = await supabase
      .from('lessons_new')
      .select('id, title')
      .eq('topic_id', topicId)
      .eq('status', 'published')

    const lessonList = publishedLessons ?? []
    let incomplete = []

    if (sid && lessonList.length > 0) {
      // For each lesson, check if all sections are completed via student_progress
      const lessonCompletion = await Promise.all(
        lessonList.map(async (lesson) => {
          // Count total sections
          const { count: totalSections } = await supabase
            .from('lesson_sections')
            .select('id', { count: 'exact', head: true })
            .eq('lesson_id', lesson.id)

          // Count completed sections for this student
          const { count: completedSections } = await supabase
            .from('student_progress')
            .select('section_id', { count: 'exact', head: true })
            .eq('student_id', sid)
            .eq('lesson_id', lesson.id)

          const total = totalSections ?? 0
          const done  = completedSections ?? 0
          return { ...lesson, isComplete: total > 0 && done >= total }
        })
      )
      incomplete = lessonCompletion.filter(l => !l.isComplete)
    } else if (!sid) {
      incomplete = lessonList
    }

    setIncompleteLessons(incomplete)
    const ready = incomplete.length === 0 && lessonList.length > 0
    setAllComplete(ready)

    if (!ready) {
      setLoading(false)
      return
    }

    // 4. Fetch the quiz for this topic
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('id, topic_id, quiz_type, tier_config')
      .eq('topic_id', topicId)
      .eq('quiz_type', 'topic_test')
      .single()

    if (!quizData) {
      setError('No quiz found for this topic yet.')
      setLoading(false)
      return
    }

    setQuiz(quizData)

    // 5. Fetch quiz questions
    const { data: questionData } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, type, question_text, options, correct_answer, explanation, points, order')
      .eq('quiz_id', quizData.id)
      .order('order', { ascending: true })

    setQuestions(questionData ?? [])

    // 6. Get student's learning tier
    let tier = 'balanced'
    if (sid) {
      const { data: profileData } = await supabase
        .from('student_profiles')
        .select('learning_tier')
        .eq('user_id', sid)
        .single()
      tier = profileData?.learning_tier ?? 'balanced'
    }

    // 7. Extract tier config for this tier
    const config = quizData.tier_config?.[tier] ?? quizData.tier_config ?? null
    setTierConfig(config)

    setLoading(false)
  }

  async function handleQuizComplete(result) {
    // result shape from QuizPlayer: { score, total, passed, answers }
    setQuizResult(result)

    // Check if all topics in this unit now have passed topic tests
    if (topic?.unit_id) {
      const { data: unitTopics } = await supabase
        .from('topics')
        .select('id')
        .eq('unit_id', topic.unit_id)

      if (unitTopics && unitTopics.length > 0) {
        const topicIds = unitTopics.map(t => t.id)

        // Get quiz IDs for all topic tests in this unit
        const { data: unitQuizzes } = await supabase
          .from('quizzes')
          .select('id')
          .in('topic_id', topicIds)
          .eq('quiz_type', 'topic_test')

        if (unitQuizzes && unitQuizzes.length > 0) {
          const quizIds = unitQuizzes.map(q => q.id)
          const { data: { user } } = await supabase.auth.getUser()
          const sid = user?.id

          if (sid) {
            const { data: attempts } = await supabase
              .from('quiz_attempts')
              .select('quiz_id')
              .eq('student_id', sid)
              .in('quiz_id', quizIds)
              .eq('passed', true)

            const passedQuizIds = new Set((attempts ?? []).map(a => a.quiz_id))
            // Include the current quiz as passed since we just finished it
            if (result.passed) passedQuizIds.add(quiz?.id)

            setAllTopicsTested(quizIds.every(qid => passedQuizIds.has(qid)))
          }
        }
      }
    }
  }

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
            <Link href={`/learn/${formId}/${termId}/${subjectSlug}/${topicId}`} className="hover:opacity-100">{topicLabel}</Link>
            <span>›</span>
            <span>Topic Test</span>
          </nav>
          <h1 className="font-serif text-4xl mb-2 text-white">
            {loading ? 'Loading...' : `Topic Test: ${topicLabel}`}
          </h1>
          <p className="text-sm text-blue-100 opacity-80">
            Test your understanding of this topic.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-24 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Link href={`/learn/${formId}/${termId}/${subjectSlug}/${topicId}`} className="text-sm underline text-blue-600">
              Back to topic
            </Link>
          </div>
        ) : !allComplete ? (
          /* Locked — not all lessons complete */
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Test is locked</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Complete all lessons in this topic to unlock the test.
                </p>

                {incompleteLessons.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Remaining lessons
                    </p>
                    <ul className="space-y-2">
                      {incompleteLessons.map(lesson => (
                        <li key={lesson.id}>
                          <Link
                            href={`/learn/${formId}/${termId}/${subjectSlug}/${topicId}/lesson/${lesson.id}`}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                            {lesson.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6">
                  <Link
                    href={`/learn/${formId}/${termId}/${subjectSlug}/${topicId}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Go to topic
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : quizResult ? (
          /* Results screen */
          <div className="space-y-6">
            <div className={`bg-white border rounded-2xl shadow-sm p-8 text-center ${quizResult.passed ? 'border-green-200' : 'border-red-200'}`}>
              <div className="text-5xl mb-4">{quizResult.passed ? '🎉' : '📚'}</div>
              <h2 className="text-2xl font-bold mb-2 text-blue-800">
                {quizResult.passed ? 'Well done!' : 'Keep practising!'}
              </h2>
              <p className="text-lg text-gray-700 mb-1">
                Score: <span className="font-bold">{quizResult.score}</span> / {quizResult.total}
                {' '}
                <span className="text-sm text-gray-400">
                  ({Math.round((quizResult.score / quizResult.total) * 100)}%)
                </span>
              </p>
              <p className={`text-sm font-medium ${quizResult.passed ? 'text-green-600' : 'text-red-500'}`}>
                {quizResult.passed ? 'Passed' : 'Not passed — try again'}
              </p>

              {allTopicsTested && (
                <div className="mt-6 p-4 rounded-xl text-sm bg-pink-50 text-pink-700 border border-pink-100">
                  All topics in this unit have been tested — well done! You are ready to move on to the next unit.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/learn/${formId}/${termId}/${subjectSlug}/${topicId}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-700"
              >
                Back to topic
              </Link>
              {!quizResult.passed && (
                <button
                  onClick={() => { setQuizResult(null) }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Quiz player */
          <div className="space-y-4">
            <Link
              href={`/learn/${formId}/${termId}/${subjectSlug}/${topicId}`}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to topic
            </Link>

            <QuizPlayer
              quiz={quiz}
              questions={questions}
              tierConfig={tierConfig}
              onComplete={handleQuizComplete}
            />
          </div>
        )}
      </div>
    </div>
  )
}
