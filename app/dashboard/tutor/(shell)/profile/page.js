'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SUBJECTS as ALL_SUBJECTS } from '@/lib/constants'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'

export default function TutorProfilePage() {
  const router = useRouter()
  const toast  = useToast()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [tutorId, setTutorId]   = useState(null)
  const [userId, setUserId]     = useState(null)

  const [bio, setBio]                 = useState('')
  const [subjects, setSubjects]       = useState([])
  const [hourlyRate, setHourlyRate]   = useState('')
  const [avatarUrl, setAvatarUrl]     = useState(null)
  const [uploading, setUploading]     = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')
      setUserId(user.id)

      const [{ data: tutor }, { data: profile }] = await Promise.all([
        supabase.from('tutors').select('id, bio, subjects, hourly_rate_kwacha').eq('user_id', user.id).single(),
        supabase.from('profiles').select('avatar_url').eq('id', user.id).single(),
      ])

      if (tutor) {
        setTutorId(tutor.id)
        setBio(tutor.bio ?? '')
        setSubjects(tutor.subjects ?? [])
        setHourlyRate(String(tutor.hourly_rate_kwacha ?? ''))
      }
      setAvatarUrl(profile?.avatar_url ?? null)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB.'); return }

    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      toast.error('Failed to upload avatar.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`

    await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
    setAvatarUrl(url)
    setUploading(false)
    toast.success('Profile photo updated!')
  }

  function toggleSubject(s) {
    setSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (subjects.length === 0) {
      setError('Please select at least one subject.')
      return
    }

    const rate = parseInt(hourlyRate, 10)
    if (isNaN(rate) || rate < 50) {
      setError('Hourly rate must be at least K50.')
      return
    }

    if (!tutorId) {
      setError('Tutor profile not found. Please complete verification first.')
      return
    }

    if (bio.trim().length > 500) {
      setError('Bio must be under 500 characters.')
      return
    }

    setSaving(true)
    const { error: dbErr } = await supabase
      .from('tutors')
      .update({
        bio:                 bio.trim() || null,
        subjects,
        hourly_rate_kwacha:  rate,
      })
      .eq('id', tutorId)

    if (dbErr) {
      setError(dbErr.message)
      toast.error('Failed to save profile.')
    } else {
      setSaved(true)
      toast.success('Profile saved!')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="text-gray-400" />
    </div>
  )

  return (
    <>
      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <nav className="text-xs mb-2 opacity-60" style={{ color: 'var(--color-nav-text)' }}>
            <Link href="/dashboard/tutor" className="hover:opacity-100">Dashboard</Link>
            {' / '}My Profile
          </nav>
          <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>My Profile</h1>
          <p className="text-sm mt-0.5 opacity-70" style={{ color: 'var(--color-nav-text)' }}>
            This is what students see when they find you
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSave} className="space-y-6">

          {/* Avatar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-4" style={{ color: 'var(--color-primary)' }}>Profile photo</h2>
            <div className="flex items-center gap-5">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Profile" width={80} height={80}
                  className="w-20 h-20 rounded-full object-cover border-2"
                  style={{ borderColor: 'var(--color-surface-mid)' }} />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-medium"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                  ?
                </div>
              )}
              <div>
                <label className="inline-block text-xs px-4 py-2 rounded-lg font-medium cursor-pointer"
                  style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                  {uploading ? 'Uploading...' : avatarUrl ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
                <p className="text-xs text-gray-400 mt-1.5">JPG or PNG, max 2 MB</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-4" style={{ color: 'var(--color-primary)' }}>About you</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bio <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={5}
              maxLength={500}
              placeholder="Tell students about your qualifications, teaching style, and experience..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{bio.length}/500 characters</p>
          </div>

          {/* Subjects */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-1" style={{ color: 'var(--color-primary)' }}>Subjects</h2>
            <p className="text-sm text-gray-500 mb-4">Select all subjects you can teach.</p>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBJECTS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSubject(s)}
                  className="text-xs px-3 py-1.5 rounded-full border transition"
                  style={subjects.includes(s)
                    ? { backgroundColor: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
                    : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                  {s}
                </button>
              ))}
            </div>
            {subjects.length > 0 && (
              <p className="text-xs text-gray-400 mt-3">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>

          {/* Rate */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-4" style={{ color: 'var(--color-primary)' }}>Session rate</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Hourly rate (ZMW) <span className="text-red-400">*</span>
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">K</span>
              <input
                type="number"
                required
                min="50"
                max="5000"
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                placeholder="e.g. 150"
                className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Students see this on your public profile.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          {saved && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">Profile saved successfully.</div>
          )}

          <div className="flex items-center justify-between">
            <Link href="/dashboard/tutor" className="text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-6 py-2.5 rounded-lg font-medium disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
