'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PERSONALITY_QUESTIONS, recommendTier } from '@/lib/personality'
import { TIERS } from '@/lib/tier-config'
import FeedLayout from '@/components/layout/FeedLayout'

export default function StudentSettingsPage() {
  const router = useRouter()

  // ── Profile state ──────────────────────────────────────────────────────────
  const [userId, setUserId]           = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [formLevel, setFormLevel]     = useState('Form 1')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg]   = useState(null)

  // ── Tier state ─────────────────────────────────────────────────────────────
  const [currentTier, setCurrentTier]   = useState('balanced')
  const [selectedTier, setSelectedTier] = useState('balanced')
  const [tierSaving, setTierSaving]     = useState(false)
  const [tierMsg, setTierMsg]           = useState(null)

  // ── Personality state ──────────────────────────────────────────────────────
  const [personalityAnswers, setPersonalityAnswers] = useState([])   // [{questionId, optionIndex}]
  const [answerSaving, setAnswerSaving]             = useState(null)  // questionId being saved
  const [suggestedTier, setSuggestedTier]           = useState(null)  // banner suggestion
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false)

  // ── Subject interests state ────────────────────────────────────────────────
  const [allSubjects, setAllSubjects]         = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [subjectSaving, setSubjectSaving]     = useState(false)
  const [subjectMsg, setSubjectMsg]           = useState(null)

  // ── Loading ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)

  // ── Load everything on mount ───────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const [{ data: profile }, { data: subjects }] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('display_name, learning_tier, personality_answers, form_level, interested_subjects')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('subjects_new')
          .select('id, name')
          .order('name'),
      ])

      if (profile) {
        setDisplayName(profile.display_name ?? '')
        setFormLevel(profile.form_level ?? 'Form 1')
        setCurrentTier(profile.learning_tier ?? 'balanced')
        setSelectedTier(profile.learning_tier ?? 'balanced')
        setPersonalityAnswers(profile.personality_answers ?? [])
        setSelectedSubjects(profile.interested_subjects ?? [])
      }

      if (subjects) setAllSubjects(subjects)

      setLoading(false)
    }
    load()
  }, [router])

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getAnswerForQuestion(questionId) {
    return personalityAnswers.find(a => a.questionId === questionId) ?? null
  }

  const answeredCount = personalityAnswers.length

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function saveProfile() {
    setProfileSaving(true)
    setProfileMsg(null)
    const { error } = await supabase
      .from('student_profiles')
      .update({ display_name: displayName.trim(), form_level: formLevel })
      .eq('user_id', userId)
    setProfileSaving(false)
    setProfileMsg(error ? { type: 'error', text: error.message } : { type: 'ok', text: 'Profile saved.' })
    setTimeout(() => setProfileMsg(null), 3000)
  }

  async function saveTier() {
    setTierSaving(true)
    setTierMsg(null)
    const { error } = await supabase
      .from('student_profiles')
      .update({ learning_tier: selectedTier })
      .eq('user_id', userId)
    setTierSaving(false)
    if (!error) {
      setCurrentTier(selectedTier)
      setTierMsg({ type: 'ok', text: 'Learning tier updated.' })
      // If user just accepted a suggestion, dismiss the banner
      if (selectedTier === suggestedTier) setDismissedSuggestion(true)
    } else {
      setTierMsg({ type: 'error', text: error.message })
    }
    setTimeout(() => setTierMsg(null), 3000)
  }

  async function handleAnswerClick(questionId, optionIndex) {
    setAnswerSaving(questionId)
    // Build updated answers array (upsert by questionId)
    const existing = personalityAnswers.filter(a => a.questionId !== questionId)
    const updated  = [...existing, { questionId, optionIndex }]

    const { error } = await supabase
      .from('student_profiles')
      .update({ personality_answers: updated })
      .eq('user_id', userId)

    if (!error) {
      setPersonalityAnswers(updated)
      // Recalculate suggestion
      const recommendation = recommendTier(updated)
      if (recommendation !== currentTier) {
        setSuggestedTier(recommendation)
        setDismissedSuggestion(false)
      } else {
        setSuggestedTier(null)
      }
    }
    setAnswerSaving(null)
  }

  async function acceptTierSuggestion() {
    setSelectedTier(suggestedTier)
    const { error } = await supabase
      .from('student_profiles')
      .update({ learning_tier: suggestedTier })
      .eq('user_id', userId)
    if (!error) {
      setCurrentTier(suggestedTier)
      setDismissedSuggestion(true)
    }
  }

  async function saveSubjects() {
    setSubjectSaving(true)
    setSubjectMsg(null)
    const { error } = await supabase
      .from('student_profiles')
      .update({ interested_subjects: selectedSubjects })
      .eq('user_id', userId)
    setSubjectSaving(false)
    setSubjectMsg(error ? { type: 'error', text: error.message } : { type: 'ok', text: 'Subject interests saved.' })
    setTimeout(() => setSubjectMsg(null), 3000)
  }

  function toggleSubject(id) {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <FeedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-gray-400">Loading settings…</div>
        </div>
      </FeedLayout>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <FeedLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        <h1 className="text-2xl font-bold text-blue-600">
          Settings &amp; Personalisation
        </h1>

        {/* ── 1. Profile ───────────────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-gray-800">Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Form level</label>
              <select
                value={formLevel}
                onChange={e => setFormLevel(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {['Form 1', 'Form 2', 'Form 3', 'Form 4'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
            {profileMsg && (
              <span className={`text-sm ${profileMsg.type === 'ok' ? 'text-blue-600' : 'text-red-600'}`}>
                {profileMsg.text}
              </span>
            )}
          </div>
        </section>

        {/* ── 2. Learning Tier ─────────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Learning Tier</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your tier controls difficulty, pass marks, and time limits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(TIERS).map(([key, tier]) => {
              const isActive  = key === currentTier
              const isChosen  = key === selectedTier
              return (
                <button
                  key={key}
                  onClick={() => setSelectedTier(key)}
                  className={`rounded-2xl border-2 p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isChosen
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-800">{tier.name}</span>
                    {isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{tier.description}</p>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveTier}
              disabled={tierSaving || selectedTier === currentTier}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {tierSaving ? 'Saving…' : 'Save tier'}
            </button>
            {tierMsg && (
              <span className={`text-sm ${tierMsg.type === 'ok' ? 'text-blue-600' : 'text-red-600'}`}>
                {tierMsg.text}
              </span>
            )}
          </div>
        </section>

        {/* ── 3. Personalisation Questions ─────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Personalisation</h2>
            <p className="text-sm text-gray-500 mt-1">
              {answeredCount} of {PERSONALITY_QUESTIONS.length} questions answered
            </p>
          </div>

          {/* Tier suggestion banner */}
          {suggestedTier && !dismissedSuggestion && suggestedTier !== currentTier && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3">
              <p className="text-sm text-pink-700">
                Based on your answers, we recommend{' '}
                <span className="font-semibold">{TIERS[suggestedTier]?.name}</span>.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={acceptTierSuggestion}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Switch
                </button>
                <button
                  onClick={() => setDismissedSuggestion(true)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium border border-pink-300 text-pink-700 hover:bg-pink-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Questions list */}
          <div className="space-y-6">
            {PERSONALITY_QUESTIONS.map((q, qIdx) => {
              const answer    = getAnswerForQuestion(q.id)
              const isSaving  = answerSaving === q.id
              const answered  = answer !== null

              return (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800">
                      {qIdx + 1}. {q.question}
                    </p>
                    {!answered && (
                      <span className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 italic mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-pink-400 inline-block" />
                        Not answered
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answered && answer.optionIndex === optIdx
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleAnswerClick(q.id, optIdx)}
                          disabled={isSaving}
                          className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-60 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white font-medium'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  {isSaving && (
                    <p className="text-xs text-gray-400">Saving…</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── 4. Subject Interests ─────────────────────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Subject Interests</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select the subjects you want to focus on.
            </p>
          </div>

          {allSubjects.length === 0 ? (
            <p className="text-sm text-gray-400">Loading subjects…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allSubjects.map(subject => {
                const checked = selectedSubjects.includes(subject.id)
                return (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 ${
                      checked
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 bg-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {subject.name}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={saveSubjects}
              disabled={subjectSaving}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {subjectSaving ? 'Saving…' : 'Save interests'}
            </button>
            {subjectMsg && (
              <span className={`text-sm ${subjectMsg.type === 'ok' ? 'text-blue-600' : 'text-red-600'}`}>
                {subjectMsg.text}
              </span>
            )}
          </div>
        </section>

      </div>
    </FeedLayout>
  )
}
