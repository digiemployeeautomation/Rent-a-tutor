'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import FullScreenLayout from '@/components/layout/FullScreenLayout'
import VideoPlayer from '@/components/lesson/VideoPlayer'
import SlideViewer from '@/components/lesson/SlideViewer'
import QuizPlayer from '@/components/lesson/QuizPlayer'
import LessonProgress from '@/components/lesson/LessonProgress'
import Paywall from '@/components/lesson/Paywall'
import FloatingXP from '@/components/ui/FloatingXP'
import LevelUpOverlay from '@/components/ui/LevelUpOverlay'
import { supabase } from '@/lib/supabase'
import { hasAccess } from '@/lib/subscription'
import { getTierConfig } from '@/lib/tier-config'
import { getLevelForXP, XP_REWARDS } from '@/lib/xp'

// ── helpers ──────────────────────────────────────────────────────────────────

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function buildSteps(sections, quizzes) {
  // Merge lesson_sections and quizzes into a single ordered step array,
  // sorted by their "order" field.
  const sectionSteps = (sections ?? []).map(s => ({
    kind: 'section',
    id: s.id,
    type: s.type,               // 'video' | 'slides'
    order: s.order ?? 0,
    data: s,
    label: s.type === 'video' ? 'Video' : 'Slides',
  }))

  const quizSteps = (quizzes ?? []).map(q => ({
    kind: 'quiz',
    id: q.id,
    type: 'quiz',
    order: q.order ?? 0,
    data: q,
    label: 'Quiz',
  }))

  return [...sectionSteps, ...quizSteps].sort((a, b) => a.order - b.order)
}

// ── Lesson Complete screen ────────────────────────────────────────────────────

function LessonCompleteScreen({ lesson, formId, termId, subjectSlug, topicId }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center max-w-md mx-auto">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h2 className="font-serif text-2xl font-semibold text-gray-800 mb-2">
          Lesson Complete!
        </h2>
        <p className="text-sm text-gray-500">
          Great work finishing <span className="font-medium text-gray-700">{lesson?.title}</span>.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <Link
          href={`/learn/${formId}/${termId}/${subjectSlug}/${topicId}`}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white text-center hover:bg-blue-700 transition-colors"
        >
          Back to topic
        </Link>
        <Link
          href={`/learn/${formId}/${termId}/${subjectSlug}`}
          className="w-full rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600 text-center hover:bg-gray-50 transition-colors"
        >
          Back to subject
        </Link>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const { formId, termId, subjectSlug, topicId, lessonId } = useParams()
  const router = useRouter()

  // ── data state ─────────────────────────────────────────────────────────────
  const [loading, setLoading]           = useState(true)
  const [lesson, setLesson]             = useState(null)
  const [steps, setSteps]               = useState([])
  const [quizMap, setQuizMap]           = useState({})     // quizId → { quiz, questions }
  const [subject, setSubject]           = useState(null)
  const [form, setForm]                 = useState(null)
  const [term, setTerm]                 = useState(null)

  // ── access / tier ──────────────────────────────────────────────────────────
  const [studentId, setStudentId]       = useState(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [learningTier, setLearningTier] = useState('balanced')

  // ── progress state ─────────────────────────────────────────────────────────
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps]     = useState(new Set())
  const [lessonDone, setLessonDone]             = useState(false)

  // ── gamification state ─────────────────────────────────────────────────────
  const [floatingXP, setFloatingXP] = useState(null)
  const [levelUp, setLevelUp]       = useState(null)

  // ── paywall gating ─────────────────────────────────────────────────────────
  // Index 0 (first video) is always free. After that, require subscription.
  const showPaywall = !isSubscribed && currentStepIndex > 0

  // ── load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!lessonId) return

    async function load() {
      // 1. Auth
      const { data: { user } } = await supabase.auth.getUser()
      const sid = user?.id ?? null
      setStudentId(sid)

      // 2. Lesson
      const { data: lessonData } = await supabase
        .from('lessons_new')
        .select('id, topic_id, title, description, status')
        .eq('id', lessonId)
        .single()

      setLesson(lessonData)

      // 3. Lesson sections
      const { data: sectionsData } = await supabase
        .from('lesson_sections')
        .select('id, lesson_id, type, order, content_url, cloudflare_video_id, slides_data')
        .eq('lesson_id', lessonId)
        .order('order', { ascending: true })

      // 4. Quizzes
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('id, lesson_id, quiz_type, order, tier_config')
        .eq('lesson_id', lessonId)
        .order('order', { ascending: true })

      // 5. Quiz questions for each quiz
      const qMap = {}
      if (quizzesData && quizzesData.length > 0) {
        await Promise.all(
          quizzesData.map(async quiz => {
            const { data: questionsData } = await supabase
              .from('quiz_questions')
              .select('id, quiz_id, type, question_text, options, correct_answer, explanation, points, order')
              .eq('quiz_id', quiz.id)
              .order('order', { ascending: true })
            qMap[quiz.id] = { quiz, questions: questionsData ?? [] }
          })
        )
      }
      setQuizMap(qMap)

      // 6. Build steps
      const builtSteps = buildSteps(sectionsData, quizzesData)
      setSteps(builtSteps)

      // 7. Student progress — which sections/quizzes are already done
      const completedSet = new Set()
      if (sid) {
        const { data: progressData } = await supabase
          .from('student_progress')
          .select('section_id')
          .eq('student_id', sid)
          .eq('lesson_id', lessonId)

        if (progressData) {
          const completedIds = new Set(progressData.map(p => p.section_id))
          builtSteps.forEach((step, idx) => {
            if (completedIds.has(step.id)) completedSet.add(idx)
          })
        }
      }
      setCompletedSteps(completedSet)

      // Start at first incomplete step
      const firstIncomplete = builtSteps.findIndex((_, idx) => !completedSet.has(idx))
      const startIndex = firstIncomplete === -1 ? builtSteps.length : firstIncomplete

      if (firstIncomplete === -1 && builtSteps.length > 0) {
        setLessonDone(true)
      } else {
        setCurrentStepIndex(startIndex < builtSteps.length ? startIndex : 0)
      }

      // 8. Subscription access
      if (sid) {
        const { data: subjectData } = await supabase
          .from('subjects_new')
          .select('id, name, slug')
          .eq('slug', subjectSlug)
          .single()

        setSubject(subjectData)

        if (subjectData) {
          const access = await hasAccess(supabase, sid, {
            subjectId: subjectData.id,
            formId,
            termId,
          })
          setIsSubscribed(access)
        }

        // 9. Learning tier
        const { data: profileData } = await supabase
          .from('student_profiles')
          .select('learning_tier')
          .eq('user_id', sid)
          .single()

        setLearningTier(profileData?.learning_tier ?? 'balanced')
      }

      // 10. Form / Term metadata for breadcrumb
      const [{ data: formData }, { data: termData }] = await Promise.all([
        supabase.from('forms').select('id, name').eq('id', formId).single(),
        supabase.from('terms').select('id, name').eq('id', termId).single(),
      ])
      setForm(formData)
      setTerm(termData)

      setLoading(false)
    }

    load()
  }, [lessonId, formId, termId, subjectSlug])

  // ── mark progress ──────────────────────────────────────────────────────────

  const markSectionComplete = useCallback(async (stepIdx) => {
    const step = steps[stepIdx]
    if (!step) return

    // Optimistically mark complete
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.add(stepIdx)
      return next
    })

    // Post to /api/progress
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, sectionId: step.id }),
      })
    } catch {
      // Non-blocking — progress will re-sync on next load
    }
  }, [steps, lessonId])

  // ── advance step ───────────────────────────────────────────────────────────

  const advanceStep = useCallback(async (fromIndex) => {
    await markSectionComplete(fromIndex)

    const nextIndex = fromIndex + 1
    if (nextIndex >= steps.length) {
      setLessonDone(true)
    } else {
      setCurrentStepIndex(nextIndex)
    }
  }, [markSectionComplete, steps])

  // ── handlers ───────────────────────────────────────────────────────────────

  async function awardXP(amount) {
    setFloatingXP(amount)
    // Check if level changed after awarding XP by fetching updated profile
    if (studentId) {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('xp_total, current_level')
        .eq('user_id', studentId)
        .single()
      if (profile) {
        const newLevel = getLevelForXP(profile.xp_total)
        if (newLevel > (profile.current_level ?? 1)) {
          setLevelUp(newLevel)
        }
      }
    }
  }

  function handleSectionDone() {
    awardXP(XP_REWARDS.complete_section)
    advanceStep(currentStepIndex)
  }

  function handleQuizComplete({ passed, score, maxScore }) {
    if (passed) {
      awardXP(XP_REWARDS.pass_lesson_quiz)
    }
    advanceStep(currentStepIndex)
  }

  function handleSubscribed() {
    setIsSubscribed(true)
  }

  // ── loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <FullScreenLayout title="Loading…">
        <div className="flex items-center justify-center py-32">
          <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </FullScreenLayout>
    )
  }

  if (!lesson) {
    return (
      <FullScreenLayout title="Lesson not found">
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <p className="text-sm text-gray-500">Lesson not found.</p>
          <Link href={`/learn/${formId}/${termId}/${subjectSlug}`} className="text-xs text-blue-600 underline">
            Back to subject
          </Link>
        </div>
      </FullScreenLayout>
    )
  }

  // ── current step data ──────────────────────────────────────────────────────

  const currentStep = steps[currentStepIndex]
  const tierCfg     = getTierConfig(learningTier)

  // Progress bar descriptors
  const progressSections = steps.map(s => ({
    type: s.type,
    label: s.label,
  }))

  // Progress percentage for FullScreenLayout header bar
  const progressPct = steps.length === 0
    ? 0
    : lessonDone
      ? 100
      : Math.round((completedSteps.size / steps.length) * 100)

  const isLastStep = currentStepIndex === steps.length - 1
  const isQuizStep = currentStep?.kind === 'quiz'

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <FullScreenLayout title={lesson.title} progress={progressPct}>
      {/* Gamification overlays */}
      {levelUp !== null && (
        <LevelUpOverlay level={levelUp} onDone={() => setLevelUp(null)} />
      )}

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-32">

        {/* Progress dots */}
        {steps.length > 0 && !lessonDone && (
          <LessonProgress
            sections={progressSections}
            currentIndex={currentStepIndex}
            completedIndexes={[...completedSteps]}
          />
        )}

        {/* Lesson complete */}
        {lessonDone ? (
          <LessonCompleteScreen
            lesson={lesson}
            formId={formId}
            termId={termId}
            subjectSlug={subjectSlug}
            topicId={topicId}
          />
        ) : showPaywall ? (
          /* Paywall — shown after step 0 if not subscribed */
          <div className="max-w-xl mx-auto">
            <Paywall
              subjectName={subject?.name ?? subjectSlug}
              formName={form?.name ?? formId}
              termName={term?.name ?? termId}
              subjectId={subject?.id}
              formId={formId}
              termId={termId}
              onSubscribed={handleSubscribed}
            />
          </div>
        ) : currentStep ? (
          <div className="space-y-6">
            {/* Step label */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {currentStep.label}
              </span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>

            {/* Video step */}
            {currentStep.kind === 'section' && currentStep.type === 'video' && (
              <VideoPlayer
                cloudflareVideoId={currentStep.data.cloudflare_video_id}
                contentUrl={currentStep.data.content_url}
              />
            )}

            {/* Slides step */}
            {currentStep.kind === 'section' && currentStep.type === 'slides' && (
              <SlideViewer slidesData={currentStep.data.slides_data} />
            )}

            {/* Quiz step */}
            {currentStep.kind === 'quiz' && (() => {
              const quizData = quizMap[currentStep.id]
              if (!quizData) return (
                <div className="text-sm text-gray-400 text-center py-8">Quiz data not available.</div>
              )

              const tierQuiz = tierCfg?.lesson_quiz ?? {}
              const tierConfig = {
                pass_mark:         tierQuiz.pass_mark ?? 0,
                show_explanations: tierQuiz.show_explanations ?? 'after_submit',
                max_retries:       tierQuiz.max_retries ?? null,
              }

              return (
                <div className="relative">
                  {floatingXP !== null && (
                    <FloatingXP amount={floatingXP} onDone={() => setFloatingXP(null)} />
                  )}
                  <QuizPlayer
                    quiz={quizData.quiz}
                    questions={quizData.questions}
                    tierConfig={tierConfig}
                    tier={learningTier}
                    onComplete={handleQuizComplete}
                  />
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="text-sm text-gray-400 text-center py-16">No content available for this lesson yet.</div>
        )}
      </div>

      {/* Bottom Continue / Complete button — shown for video and slides steps */}
      {!lessonDone && !showPaywall && currentStep && currentStep.kind === 'section' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 safe-area-inset-bottom">
          <div className="max-w-3xl mx-auto relative">
            {floatingXP !== null && (
              <FloatingXP amount={floatingXP} onDone={() => setFloatingXP(null)} />
            )}
            <button
              onClick={handleSectionDone}
              className={classNames(
                'w-full rounded-xl py-3.5 text-base font-semibold text-white transition-colors',
                isLastStep
                  ? 'bg-pink-500 hover:bg-pink-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {isLastStep ? 'Complete Lesson' : 'Continue →'}
            </button>
          </div>
        </div>
      )}
    </FullScreenLayout>
  )
}
