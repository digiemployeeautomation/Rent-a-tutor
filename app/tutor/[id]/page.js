'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZM', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── Booking modal ─────────────────────────────────────────────
function BookingModal({ tutor, tutorName, user, onClose, onSuccess }) {
  const [subject, setSubject] = useState(tutor.subjects?.[0] ?? '')
  const [date, setDate]       = useState('')
  const [time, setTime]       = useState('')
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  // Use local date format for the min attribute (not UTC, which can be off by a day)
  const minDateStr = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`

  async function handleBook(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString()

    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        student_id:   user.id,
        // FIX: use tutor.user_id (auth user id) not tutor.id (tutors table PK)
        // so it matches how the tutor dashboard queries bookings
        tutor_id:     tutor.user_id,
        subject,
        scheduled_at: scheduledAt,
        amount:       tutor.hourly_rate_kwacha,
        status:       'pending',
        notes:        notes.trim() || null,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>
                Book a session
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">with {tutorName}</p>
            </div>
            {!loading && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Session rate</span>
            <span className="font-serif text-2xl" style={{ color: 'var(--color-primary)' }}>
              K{tutor.hourly_rate_kwacha}/hr
            </span>
          </div>
        </div>

        <form onSubmit={handleBook} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Subject</label>
            <select
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white"
            >
              {(tutor.subjects ?? []).length === 0 && (
                <option value="">No subjects available</option>
              )}
              {(tutor.subjects ?? []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                required
                min={minDateStr}
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Topics you'd like to cover..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
          >
            {loading ? 'Sending request...' : 'Send booking request →'}
          </button>

          <p className="text-xs text-center text-gray-400">
            Payment is arranged after the tutor confirms your session.
          </p>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function TutorProfilePage() {
  const params  = useParams()
  const router  = useRouter()
  const tutorId = params?.id

  const [tutor, setTutor]         = useState(null)
  const [lessons, setLessons]     = useState([])
  const [reviews, setReviews]     = useState([])
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [booked, setBooked]       = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      const { data: tutorData } = await supabase
        .from('tutors')
        .select(`
          id, user_id, subjects, hourly_rate_kwacha, avg_rating, total_reviews,
          is_featured, verification_status, badge, bio,
          profiles ( full_name, avatar_url )
        `)
        .eq('id', tutorId)
        .eq('is_approved', true)
        .single()

      if (!tutorData) {
        router.replace('/tutor')
        return
      }

      // FIX: lessons.tutor_id is the auth user id, not tutors.id
      // so we must query by tutorData.user_id, not tutorId
      const [{ data: lessonData }, { data: reviewData }] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title, subject, form_level, price, duration_seconds, purchase_count')
          .eq('tutor_id', tutorData.user_id)
          .eq('status', 'active')
          .neq('flagged', true)
          .order('purchase_count', { ascending: false })
          .limit(6),
        supabase
          .from('reviews')
          .select('id, rating, comment, created_at, profiles(full_name)')
          .eq('tutor_id', tutorData.user_id)
          .neq('flagged', true)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setTutor(tutorData)
      setLessons(lessonData ?? [])
      setReviews(reviewData ?? [])
      setLoading(false)
    }
    if (tutorId) load()
  }, [tutorId, router])

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
        <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  )

  if (!tutor) return null

  const name     = tutor.profiles?.full_name ?? 'Tutor'
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const avatar   = tutor.profiles?.avatar_url
  const rating   = tutor.avg_rating?.toFixed(1) ?? null

  function handleBookClick() {
    if (!user) {
      router.push(`/auth/login?redirectTo=/tutor/${tutorId}`)
      return
    }
    setShowModal(true)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Breadcrumb */}
      <div className="px-6 pt-6 pb-0 max-w-4xl mx-auto">
        <nav className="text-xs text-gray-400 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/tutor" className="hover:text-gray-600">Find a tutor</Link>
          <span>/</span>
          <span className="text-gray-600">{name}</span>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left column ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile header */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start gap-5">
              {avatar ? (
                <img src={avatar} alt={name}
                  className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-medium flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                  {initials}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-serif text-2xl" style={{ color: 'var(--color-primary)' }}>
                    {name}
                  </h1>
                  {tutor.badge && (
                    <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                      ✓ {tutor.badge}
                    </span>
                  )}
                  {tutor.is_featured && (
                    <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-accent)' }}>
                      Featured
                    </span>
                  )}
                </div>

                {rating && (
                  <p className="text-sm text-gray-500 mb-2">
                    ★ {rating} · {tutor.total_reviews ?? 0} review{tutor.total_reviews !== 1 ? 's' : ''}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {(tutor.subjects ?? []).map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {tutor.bio && (
              <p className="text-sm text-gray-600 leading-relaxed mt-5 pt-5 border-t border-gray-100 whitespace-pre-line">
                {tutor.bio}
              </p>
            )}
          </div>

          {/* Lessons */}
          {lessons.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-serif text-lg mb-4" style={{ color: 'var(--color-primary)' }}>
                Lessons by {name.split(' ')[0]}
              </h2>
              <div className="space-y-3">
                {lessons.map(l => (
                  <Link key={l.id}
                    href={`/browse/${encodeURIComponent(l.subject)}/lesson/${l.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{l.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {l.subject} · {l.form_level ?? 'All levels'} · {l.purchase_count ?? 0} purchases
                      </div>
                    </div>
                    <span className="text-xs font-medium px-3 py-1.5 rounded-lg ml-4 flex-shrink-0"
                      style={{ backgroundColor: '#e8c84a', color: '#1a2a00' }}>
                      K{l.price}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-serif text-lg mb-4" style={{ color: 'var(--color-primary)' }}>
                Student reviews
              </h2>
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {r.profiles?.full_name ?? 'Student'}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                    </div>
                    <div className="text-xs text-amber-500 mb-1">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                    {r.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100"
              style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="text-xs text-gray-500 mb-1">Session rate</div>
              <div className="font-serif text-3xl" style={{ color: 'var(--color-primary)' }}>
                K{tutor.hourly_rate_kwacha}
                <span className="text-base font-sans font-normal text-gray-400">/hr</span>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              {booked ? (
                <div className="w-full py-3 rounded-lg text-sm font-medium text-center"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                  ✓ Request sent!
                </div>
              ) : (
                <button
                  onClick={handleBookClick}
                  className="w-full py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                  Book a session
                </button>
              )}

              {!user && (
                <p className="text-xs text-center text-gray-400">
                  <Link href="/auth/login" className="underline" style={{ color: 'var(--color-primary-lit)' }}>
                    Sign in
                  </Link>{' '}to book a session
                </p>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
                  What to expect
                </p>
                {[
                  'Tutor confirms within 24 hours',
                  'Session via Zoom or in-person',
                  'Pay after confirmation',
                  'Cancel up to 2 hours before',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 text-xs text-gray-600">
                    <span style={{ color: 'var(--color-primary-lit)' }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <BookingModal
          tutor={tutor}
          tutorName={name}
          user={user}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setBooked(true) }}
        />
      )}
    </div>
  )
}
