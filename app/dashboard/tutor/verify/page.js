'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

function FileUploadBox({ label, hint, id, accept, file, onChange }) {
  const preview = file ? URL.createObjectURL(file) : null

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <p className="text-xs text-gray-400 mb-2">{hint}</p>
      <label htmlFor={id}
        className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition overflow-hidden"
        style={{ minHeight: '120px', backgroundColor: 'var(--color-page-bg)' }}>
        {preview ? (
          <img src={preview} alt="preview" className="w-full max-h-56 object-contain p-2" />
        ) : (
          <div className="text-center p-6">
            <div className="text-2xl mb-2">📎</div>
            <div className="text-xs text-gray-500">Click to upload</div>
            <div className="text-xs text-gray-400 mt-1">{accept === 'image/*' ? 'JPG, PNG, HEIC' : 'JPG, PNG, PDF'}</div>
          </div>
        )}
      </label>
      <input id={id} type="file" accept={accept} className="hidden"
        onChange={e => onChange(e.target.files[0] ?? null)} />
      {file && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500 truncate">{file.name}</span>
          <button type="button" onClick={() => onChange(null)}
            className="text-xs text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">Remove</button>
        </div>
      )}
    </div>
  )
}

export default function TutorVerifyPage() {
  const router  = useRouter()
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [progress, setProgress] = useState('')

  const [selfie, setSelfie]     = useState(null)
  const [idNumber, setIdNumber] = useState('')
  const [idFront, setIdFront]   = useState(null)
  const [idBack, setIdBack]     = useState(null)

  useEffect(() => {
    async function check() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.replace('/auth/login'); return }
      setUser(u)

      let { data: tutor } = await supabase
        .from('tutors')
        .select('is_approved, verification_submitted')
        .eq('user_id', u.id)
        .single()

      // tutors row missing — signup trigger didn't create it.
      // Insert it now so the user can proceed to verification.
      if (!tutor) {
        const { error: insertErr } = await supabase
          .from('tutors')
          .insert({ user_id: u.id, is_approved: false, verification_submitted: false })

        if (insertErr) {
          console.error('[verify] could not create tutors row:', insertErr)
          router.replace('/auth/login')
          return
        }

        tutor = { is_approved: false, verification_submitted: false }
      }

      if (tutor.is_approved)            return router.replace('/dashboard/tutor')
      if (tutor.verification_submitted) return router.replace('/auth/pending')

      setLoading(false)
    }
    check()
  }, [router])

  async function uploadFile(file, fileName) {
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/${fileName}.${ext}`
    const { error } = await supabase.storage
      .from('verifications')
      .upload(path, file, { upsert: true })
    if (error) throw new Error(`Upload failed: ${error.message}`)
    return path
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!selfie)          return setError('Please upload a selfie or passport photo.')
    if (!idNumber.trim()) return setError('Please enter your National ID number.')
    if (!idFront)         return setError('Please upload the front of your National ID.')
    if (!idBack)          return setError('Please upload the back of your National ID.')

    setSaving(true)
    try {
      setProgress('Uploading selfie…')
      const selfiePath = await uploadFile(selfie, 'selfie')

      setProgress('Uploading ID front…')
      const frontPath  = await uploadFile(idFront, 'nid_front')

      setProgress('Uploading ID back…')
      const backPath   = await uploadFile(idBack, 'nid_back')

      setProgress('Saving…')
      const { error: dbErr } = await supabase
        .from('tutors')
        .update({
          national_id_number:     idNumber.trim(),
          selfie_path:            selfiePath,
          national_id_front_path: frontPath,
          national_id_back_path:  backPath,
          verification_submitted: true,
        })
        .eq('user_id', user.id)

      if (dbErr) throw new Error(dbErr.message)

      router.replace('/auth/pending')
    } catch (err) {
      setError(err.message)
      setSaving(false)
      setProgress('')
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl mb-2" style={{ color: 'var(--color-primary)' }}>
            Verify your identity
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Before you can start teaching, we need to verify your identity.
            Your documents are kept private and only used for verification.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['Photo', 'ID number', 'ID scan', 'Submit'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mb-1"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-nav-text)' }}>
                  {i + 1}
                </div>
                <span className="text-xs text-gray-400 text-center">{step}</span>
              </div>
              {i < 3 && <div className="w-4 h-px bg-gray-200 flex-shrink-0 mb-4" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-8">

          <FileUploadBox
            label="Selfie or passport photo"
            hint="A clear photo of your face. Must match your National ID."
            id="selfie"
            accept="image/*"
            file={selfie}
            onChange={setSelfie}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              National ID number <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">Enter the number exactly as it appears on your card.</p>
            <input
              type="text"
              required
              value={idNumber}
              onChange={e => setIdNumber(e.target.value)}
              placeholder="e.g. 123456/78/9"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 font-mono"
            />
          </div>

          <FileUploadBox
            label="National ID — front"
            hint="Clear scan or photo of the front of your National ID card."
            id="nid-front"
            accept="image/*,application/pdf"
            file={idFront}
            onChange={setIdFront}
          />

          <FileUploadBox
            label="National ID — back"
            hint="Clear scan or photo of the back of your National ID card."
            id="nid-back"
            accept="image/*,application/pdf"
            file={idBack}
            onChange={setIdBack}
          />

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
            {saving ? progress || 'Submitting…' : 'Submit for review →'}
          </button>

          <p className="text-xs text-center text-gray-400">
            Your documents are encrypted and only viewed by our verification team.
          </p>
        </form>
      </div>
    </div>
  )
}
