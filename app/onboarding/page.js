'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getQuestions, recommendTier } from '@/lib/personality'
import PersonalityQuiz from '@/components/onboarding/PersonalityQuiz'
import TierRecommendation from '@/components/onboarding/TierRecommendation'

const STEP_WELCOME = 'welcome'
const STEP_QUIZ = 'quiz'
const STEP_TIER = 'tier'
const STEP_SUBJECTS = 'subjects'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(STEP_WELCOME)
  const [questionCount, setQuestionCount] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState([])
  const [recommendedTier, setRecommendedTier] = useState('balanced')
  const [selectedTier, setSelectedTier] = useState('balanced')
  const [subjects, setSubjects] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Fetch available subjects on mount
  useEffect(() => {
    async function fetchSubjects() {
      const { data, error } = await supabase
        .from('subjects_new')
        .select('id, name')
        .order('name')
      if (!error && data) {
        setSubjects(data)
      }
    }
    fetchSubjects()
  }, [])

  // --- Step handlers ---

  function handleQuickStart(count) {
    setQuestionCount(count)
    setStep(STEP_QUIZ)
  }

  function handleSkip() {
    // Skip quiz — go straight to subjects with balanced tier
    setRecommendedTier('balanced')
    setSelectedTier('balanced')
    setStep(STEP_SUBJECTS)
  }

  function handleQuizComplete(answers) {
    setQuizAnswers(answers)
    const tier = recommendTier(answers)
    setRecommendedTier(tier)
    setSelectedTier(tier)
    setStep(STEP_TIER)
  }

  function handleTierConfirm(tier) {
    setSelectedTier(tier)
    setStep(STEP_SUBJECTS)
  }

  function toggleSubject(id) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  async function handleFinish() {
    setSaving(true)
    setError(null)

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error('Not authenticated')

      const { error: updateErr } = await supabase
        .from('student_profiles')
        .update({
          personality_answers: quizAnswers,
          learning_tier: selectedTier,
          onboarding_complete: true,
          interested_subjects: selectedSubjects,
        })
        .eq('user_id', user.id)

      if (updateErr) throw updateErr

      router.push('/dashboard/student')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  async function handleSkipAll() {
    setSaving(true)
    setError(null)

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error('Not authenticated')

      const { error: updateErr } = await supabase
        .from('student_profiles')
        .update({
          learning_tier: 'balanced',
          onboarding_complete: false,
        })
        .eq('user_id', user.id)

      if (updateErr) throw updateErr

      router.push('/dashboard/student')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  // --- Renders ---

  if (step === STEP_WELCOME) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Welcome!</h2>
          <p className="mt-3 text-gray-600">
            We want to get to know you so we can help you learn the best way
            possible. How many questions can you answer right now?
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleQuickStart(5)}
            className="flex w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left transition-colors hover:border-forest-600 hover:bg-sage-200 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-2"
          >
            <div>
              <span className="font-semibold text-gray-800">Quick</span>
              <span className="ml-2 text-sm text-gray-500">5 questions</span>
            </div>
            <span className="text-sm text-gray-400">~1 minute</span>
          </button>

          <button
            onClick={() => handleQuickStart(10)}
            className="flex w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left transition-colors hover:border-forest-600 hover:bg-sage-200 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-2"
          >
            <div>
              <span className="font-semibold text-gray-800">Standard</span>
              <span className="ml-2 text-sm text-gray-500">10 questions</span>
            </div>
            <span className="text-sm text-gray-400">~2 minutes</span>
          </button>

          <button
            onClick={() => handleQuickStart(15)}
            className="flex w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left transition-colors hover:border-forest-600 hover:bg-sage-200 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-2"
          >
            <div>
              <span className="font-semibold text-gray-800">Full</span>
              <span className="ml-2 text-sm text-gray-500">15 questions</span>
            </div>
            <span className="text-sm text-gray-400">~5 minutes</span>
          </button>

          <button
            onClick={handleSkip}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 px-5 py-4 text-center text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    )
  }

  if (step === STEP_QUIZ) {
    const questions = getQuestions(questionCount)
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quick personality quiz</h2>
          <p className="mt-1 text-sm text-gray-500">
            Help us personalise your learning experience.
          </p>
        </div>
        <PersonalityQuiz questions={questions} onComplete={handleQuizComplete} />
      </div>
    )
  }

  if (step === STEP_TIER) {
    return (
      <TierRecommendation
        recommendedTier={recommendedTier}
        onConfirm={handleTierConfirm}
      />
    )
  }

  if (step === STEP_SUBJECTS) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Which subjects interest you?</h2>
          <p className="mt-1 text-sm text-gray-500">
            These help us personalise your dashboard. Select as many as you like.
          </p>
        </div>

        {subjects.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {subjects.map((subject) => {
              const isSelected = selectedSubjects.includes(subject.id)
              return (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-2 ${
                    isSelected
                      ? 'border-forest-600 bg-sage-200 text-forest-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {subject.name}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Loading subjects…</p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full rounded-lg bg-[var(--color-btn-bg,theme(colors.forest.600))] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:ring-offset-2 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Continue to dashboard'}
          </button>

          <button
            onClick={handleSkipAll}
            disabled={saving}
            className="text-center text-sm text-gray-400 hover:text-gray-600 disabled:opacity-60"
          >
            Skip and set up later
          </button>
        </div>
      </div>
    )
  }

  return null
}
