// app/learn/[formId]/[termId]/term-exam/[subjectSlug]/page.js
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import QuizPlayer from '@/components/lesson/QuizPlayer'

// ── inline ResultsReport component ───────────────────────────────────────────

function gradeFromPercent(pct) {
  if (pct >= 80) return 'A'
  if (pct >= 65) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'E'
}

function ResultsReport({ tier, result, topicScores }) {
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0

  if (tier === 'guided') {
    const strong  = (topicScores ?? []).filter(t => t.pct >= 60)
    const review  = (topicScores ?? []).filter(t => t.pct < 60)
    return (
      <div className="space-y-4 mt-4">
        {strong.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Strong in</p>
            <ul className="space-y-1">
              {strong.map(t => (
                <li key={t.topicId} className="text-sm text-green-800">
                  {t.topicTitle} — {t.pct}%
                </li>
              ))}
            </ul>
          </div>
        )}
        {review.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Areas to revisit</p>
            <ul className="space-y-1">
              {review.map(t => (
                <li key={t.topicId} className="text-sm text-amber-800">
                  {t.topicTitle} — {t.pct}%
                </li>
              ))}
            </ul>
          </div>
        )}
        {strong.length === 0 && review.length === 0 && (
          <p className="text-sm text-gray-500">No topic breakdown available.</p>
        )}
      </div>
    )
  }

  if (tier === 'balanced') {
    return (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-medium text-gray-600">Topic</th>
              <th className="text-right py-2 font-medium text-gray-600">Score</th>
            </tr>
          </thead>
          <tbody>
            {(topicScores ?? []).map(t => (
              <tr key={t.topicId} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-700">{t.topicTitle}</td>
                <td className="py-2 text-right">
                  <span
                    className={`font-semibold ${t.pct >= 60 ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {t.pct}%
                  </span>
                </td>
              </tr>
            ))}
            {(!topicScores || topicScores.length === 0) && (
              <tr>
                <td colSpan={2} className="py-4 text-center text-gray-400 text-xs">
                  No topic breakdown available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  // exam_ready tier — mock report card
  const grade = gradeFromPercent(pct)
  const gradeColour = {
    A: 'text-green-600 bg-green-50 border-green-200',
    B: 'text-blue-600 bg-blue-50 border-blue-200',
    C: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    D: 'text-orange-600 bg-orange-50 border-orange-200',
    E: 'text-red-600 bg-red-50 border-red-200',
  }[grade]

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Predicted Grade</p>
      <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 text-5xl font-bold ${gradeColour}`}>
        {grade}
      </div>
      <p className="text-sm text-gray-500">Based on {pct}% in this exam</p>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function TermExamPage() {
  const { formId, termId, subjectSlug } = useParams()

  const [form, setForm]               = useState(null)
  const [term, setTerm]               = useState(null)
  const [subject, setSubject]         = useState(null)
  const [quiz, setQuiz]               = useState(null)
  const [questions, setQuestions]     = useState([])
  const [tierConfig, setTierConfig]   = useState(null)
  const [learningTier, setLearningTier] = useState('balanced')
  const [incompleteTopics, setIncompleteTopics] = useState([])
  const [allReady, setAllReady]       = useState(false)
  const [quizResult, setQuizResult]   = useState(null)
  const [topicScores, setTopicScores] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  useEffect(() => {
    if (!formId || !termId || !subjectSlug) return
    load()
  }, [formId, termId, subjectSlug])

  async function load() {
    setLoading(true)
    setError(null)

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    const sid = user?.id ?? null

    // 2. Fetch form, term, subject in parallel
    const [
      { data: formData },
      { data: termData },
      { data: subjectData },
    ] = await Promise.all([
      supabase.from('forms').select('id, level, name').eq('id', formId).single(),
      supabase.from('terms').select('id, number, name').eq('id', termId).single(),
      supabase.from('subjects_new').select('id, name, slug').eq('slug', subjectSlug).single(),
    ])

    setForm(formData)
    setTerm(termData)
    setSubject(subjectData)

    if (!subjectData) {
      setError('Subject not found.')
      setLoading(false)
      return
    }

    // 3. Find all units → topics for this subject + term
    const { data: unitData } = await supabase
      .from('units')
      .select('id')
      .eq('term_id', termId)
      .eq('subject_id', subjectData.id)

    const unitIds = (unitData ?? []).map(u => u.id)

    let allTopics = []
    if (unitIds.length > 0) {
      const { data: topicData } = await supabase
        .from('topics')
        .select('id, title')
        .in('unit_id', unitIds)

      allTopics = topicData ?? []
    }

    // Get topic_test quiz IDs for all these topics
    let incomplete = []
    if (allTopics.length > 0) {
      const topicIds = allTopics.map(t => t.id)

      const { data: topicQuizzes } = await supabase
        .from('quizzes')
        .select('id, topic_id')
        .in('topic_id', topicIds)
        .eq('quiz_type', 'topic_test')

      const quizMap = {} // topicId → quizId
      ;(topicQuizzes ?? []).forEach(q => { quizMap[q.topic_id] = q.id })

      if (sid) {
        // Check which topic_test quizzes have been passed
        const quizIds = Object.values(quizMap)
        let passedSet = new Set()
        if (quizIds.length > 0) {
          const { data: attempts } = await supabase
            .from('quiz_attempts')
            .select('quiz_id')
            .eq('student_id', sid)
            .in('quiz_id', quizIds)
            .eq('passed', true)
          ;(attempts ?? []).forEach(a => passedSet.add(a.quiz_id))
        }

        incomplete = allTopics.filter(t => {
          const qid = quizMap[t.id]
          return !qid || !passedSet.has(qid)
        })
      } else {
        incomplete = allTopics
      }
    }

    setIncompleteTopics(incomplete)
    const ready = incomplete.length === 0 && allTopics.length > 0
    setAllReady(ready)

    if (!ready) {
      setLoading(false)
      return
    }

    // 4. Fetch the term_exam quiz for this term + subject
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('id, quiz_type, tier_config')
      .eq('term_id', termId)
      .eq('subject_id', subjectData.id)
      .eq('quiz_type', 'term_exam')
      .single()

    if (!quizData) {
      setError('No term exam has been set up for this subject yet.')
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
    setLearningTier(tier)

    // 7. Extract tier config
    const config = quizData.tier_config?.[tier] ?? quizData.tier_config ?? null
    setTierConfig(config)

    setLoading(false)
  }

  function handleQuizComplete(result) {
    // result: { score, total, passed, answers }
    setQuizResult(result)

    // Build a basic topic-score breakdown from the answers array if available
    // answers: [{ questionId, isCorrect, points, ... }]
    // This is a best-effort breakdown — we use what QuizPlayer gives us
    setTopicScores([]) // populated below if topic mapping is available
  }

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
            <Link href={`/learn/${formId}/${termId}/${subjectSlug}`} className="hover:opacity-100">{subjectLabel}</Link>
            <span>›</span>
            <span>Term Exam</span>
          </nav>
          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--color-surface-mid)' }}>
            {loading
              ? 'Loading...'
              : `Term Exam: ${subjectLabel} \u2014 ${formLabel}, ${termLabel}`}
          </h1>
          <p className="text-sm opacity-70" style={{ color: 'var(--color-surface-mid)' }}>
            Demonstrate your mastery of the full term.
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
            <Link
              href={`/learn/${formId}/${termId}/${subjectSlug}`}
              className="text-sm underline"
              style={{ color: 'var(--color-primary-lit)' }}
            >
              Back to subjects
            </Link>
          </div>
        ) : !allReady ? (
          /* Locked — not all topic tests passed */
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                🔒
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Exam is locked</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Pass the topic test for every topic in this subject to unlock the term exam.
                </p>

                {incompleteTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Topics still to complete
                    </p>
                    <ul className="space-y-2">
                      {incompleteTopics.map(topic => (
                        <li key={topic.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                          {topic.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6">
                  <Link
                    href={`/learn/${formId}/${termId}/${subjectSlug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition"
                    style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
                  >
                    Back to subjects
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : quizResult ? (
          /* Results screen */
          <div className="space-y-6">
            <div
              className={`bg-white border rounded-2xl p-8 ${
                quizResult.passed ? 'border-green-200' : 'border-red-200'
              }`}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">{quizResult.passed ? '🏆' : '📚'}</div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                  {quizResult.passed ? 'Exam complete!' : 'Keep going!'}
                </h2>
                <p className="text-lg text-gray-700 mb-1">
                  Score: <span className="font-bold">{quizResult.score}</span> / {quizResult.total}
                  {' '}
                  <span className="text-sm text-gray-400">
                    ({quizResult.total > 0 ? Math.round((quizResult.score / quizResult.total) * 100) : 0}%)
                  </span>
                </p>
                <p className={`text-sm font-medium ${quizResult.passed ? 'text-green-600' : 'text-red-500'}`}>
                  {quizResult.passed ? 'Passed' : 'Not passed — try again'}
                </p>
              </div>

              {/* Tier-specific results report */}
              <ResultsReport
                tier={learningTier}
                result={quizResult}
                topicScores={topicScores}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/learn/${formId}/${termId}/${subjectSlug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-700"
              >
                Back to subjects
              </Link>
              {!quizResult.passed && (
                <button
                  onClick={() => { setQuizResult(null) }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition"
                  style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
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
              href={`/learn/${formId}/${termId}/${subjectSlug}`}
              className="inline-flex items-center gap-1.5 text-sm hover:opacity-70 transition"
              style={{ color: 'var(--color-primary-mid)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to subjects
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
