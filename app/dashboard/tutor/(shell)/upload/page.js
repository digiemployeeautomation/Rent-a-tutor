// app/dashboard/tutor/(shell)/upload/page.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SUBJECTS, FORM_LEVELS } from '@/lib/constants'
import { Spinner } from '@/components/ui/spinner'

export default function UploadLessonPage() {
  const router = useRouter()
  const [user, setUser]       = useState(null)
  const [tutor, setTutor]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  const [title, setTitle]               = useState('')
  const [subject, setSubject]           = useState(SUBJECTS[0])
  const [formLevel, setFormLevel]       = useState(FORM_LEVELS[0])
  const [price, setPrice]               = useState('')
  const [description, setDescription]   = useState('')
  const [videoId, setVideoId]           = useState('')
  const [duration, setDuration]         = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)

      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id, is_approved')
        .eq('user_id', u.id)
        .single()

      setTutor(tutorData)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (!tutor?.id) {
      setError('Tutor profile not found. Please complete your profile first.')
      setSaving(false)
      return
    }

    const priceNum = parseInt(price, 10)
    if (isNaN(priceNum) || priceNum < 10) {
      setError('Price must be at least K10.')
      setSaving(false)
      return
    }

    const durationSecs = duration ? parseInt(duration, 10) * 60 : null

    const { error: insertError } = await supabase
      .from('lessons')
      .insert({
        tutor_id:            tutor.id,
        title:               title.trim(),
        subject,
        form_level:          formLevel,
        price:               priceNum,
        description:         description.trim() || null,
        cloudflare_video_id: videoId.trim() || null,
        duration_seconds:    durationSecs,
        status:              tutor.is_approved ? 'active' : 'draft',
        flagged:             false,
        purchase_count:      0,
      })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="text-gray-400" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <nav className="text-xs text-gray-400 flex items-center gap-1.5 mb-6">
        <Link href="/dashboard/tutor" className="hover:text-gray-600">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-600">Upload lesson</span>
      </nav>

      <h1 className="font-serif text-3xl mb-1" style={{ color: 'var(--color-primary)' }}>
        Upload a lesson
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Fill in the details below. Students will see this on the browse page.
      </p>

      {!tutor?.is_approved && (
        <div className="mb-6 px-5 py-4 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--color-stat-b-bg)', borderColor: 'var(--color-accent-mid)', color: 'var(--color-stat-b-text)' }}>
          Your account is pending approval. Lessons will be saved as drafts and published once an admin approves your account.
        </div>
      )}

      {saved ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="font-serif text-xl mb-2" style={{ color: 'var(--color-primary)' }}>
            Lesson {tutor?.is_approved ? 'published' : 'saved as draft'}!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {tutor?.is_approved
              ? 'Your lesson is now live and students can find it in the browse page.'
              : 'Your lesson will go live once your account is approved.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSaved(false); setTitle(''); setDescription(''); setVideoId(''); setDuration(''); setPrice(''); setSubject(SUBJECTS[0]); setFormLevel(FORM_LEVELS[0]) }}
              className="text-sm px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
              Upload another
            </button>
            <Link href="/dashboard/tutor"
              className="text-sm px-5 py-2.5 rounded-lg font-medium"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              Back to dashboard
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lesson title <span className="text-red-400">*</span>
            </label>
            <input
              type="text" required value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Quadratic Equations"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject <span className="text-red-400">*</span>
              </label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Form level <span className="text-red-400">*</span>
              </label>
              <select value={formLevel} onChange={e => setFormLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white">
                {FORM_LEVELS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price (ZMW) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">K</span>
                <input type="number" required min="10" max="5000" value={price}
                  onChange={e => setPrice(e.target.value)} placeholder="50"
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm outline-none focus:border-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Video duration (minutes)
              </label>
              <input type="number" min="1" max="600" value={duration}
                onChange={e => setDuration(e.target.value)} placeholder="e.g. 45"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={4} placeholder="What will students learn? What topics are covered?"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cloudflare Stream video ID
            </label>
            <input type="text" value={videoId} onChange={e => setVideoId(e.target.value)}
              placeholder="e.g. ea95132c15732412d22c1476fa83f27a"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 font-mono" />
            <p className="text-xs text-gray-400 mt-1">
              Upload your video to{' '}
              <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer"
                className="underline" style={{ color: 'var(--color-primary-lit)' }}>
                Cloudflare Stream
              </a>{' '}
              and paste the video ID here. You can add this later.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Link href="/dashboard/tutor" className="text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="text-sm px-6 py-2.5 rounded-lg font-medium disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              {saving ? 'Saving...' : tutor?.is_approved ? 'Publish lesson' : 'Save as draft'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
