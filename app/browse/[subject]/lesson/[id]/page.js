'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDuration(secs) {
  if (!secs) return null
  const m = Math.floor(secs / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZM', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// Network config — Airtel: 097/096, MTN: 076/077, Zamtel: 075
const NETWORKS = [
  {
    id:    'airtel',
    label: 'Airtel Money',
    hint:  'Numbers starting 097 or 096',
    bg:    '#d00000',
    color: '#fff',
  },
  {
    id:    'mtn',
    label: 'MTN MoMo',
    hint:  'Numbers starting 076 or 077',
    bg:    '#ffc107',
    color: '#1a1a1a',
  },
  {
    id:    'zamtel',
    label: 'Zamtel Kwacha',
    hint:  'Numbers starting 075',
    bg:    '#00843d',
    color: '#fff',
  },
]

// ─── payment modal ────────────────────────────────────────────────────────────

function PaymentModal({ lesson, onClose, onSuccess }) {
  // steps: 'select' → 'phone' → 'waiting' → 'success' | 'failed'
  const [step, setStep]           = useState('select')
  const [network, setNetwork]     = useState(null)
  const [phone, setPhone]         = useState('')
  const [error, setError]         = useState('')
  const [txId, setTxId]           = useState(null)
  // confirmedAmount is set from the server response so the display is authoritative
  const [confirmedAmount, setConfirmedAmount] = useState(lesson.price)
  const pollRef                   = useRef(null)

  // Stop polling on unmount
  useEffect(() => () => clearTimeout(pollRef.current), [])

  function handleNetworkSelect(n) {
    setNetwork(n)
    setStep('phone')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleaned = phone.replace(/\s+/g, '')
    if (!/^(09|07)\d{8}$/.test(cleaned)) {
      setError('Enter a valid Zambian mobile number (e.g. 0971 234 567).')
      return
    }

    setStep('waiting')

    // 1. Request payment via our API route
    // NOTE: amount is NOT sent — the server fetches it from the database
    const res = await fetch('/api/payment/request', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        phone:    cleaned,
        lessonId: lesson.id,
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.transactionId) {
      setError(data.error ?? 'Could not initiate payment. Please try again.')
      setStep('phone')
      return
    }

    // Use the server-authoritative amount for all subsequent display
    if (data.amount) setConfirmedAmount(data.amount)

    setTxId(data.transactionId)
    // Start polling
    scheduleVerify(data.transactionId, 0)
  }

  function scheduleVerify(transactionId, count) {
    // Poll every 4 s, give up after 20 attempts (~80 s)
    if (count >= 20) {
      setStep('failed')
      setError('Payment timed out. If your money was deducted, please contact support.')
      return
    }

    pollRef.current = setTimeout(async () => {
      // NOTE: amount is NOT sent — the server re-fetches it from the database
      const res = await fetch('/api/payment/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          transactionId,
          lessonId: lesson.id,
        }),
      })

      const data = await res.json()

      if (data.status === 'successful') {
        setStep('success')
        setTimeout(() => onSuccess(), 1000)
        return
      }

      if (data.status === 'failed') {
        setStep('failed')
        setError(data.error ?? 'Payment was declined. Please try again.')
        return
      }

      // Still pending — keep polling
      scheduleVerify(transactionId, count + 1)
    }, 4000)
  }

  const net = NETWORKS.find(n => n.id === network)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget && step !== 'waiting') onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>
                Purchase lesson
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{lesson.title}</p>
            </div>
            {step !== 'waiting' && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-4 mt-0.5"
              >✕</button>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Amount due</span>
            <span className="font-serif text-2xl" style={{ color: 'var(--color-primary)' }}>
              K{confirmedAmount}
            </span>
          </div>
        </div>

        {/* Step: select network */}
        {step === 'select' && (
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 mb-4">Choose your mobile money network:</p>
            <div className="flex flex-col gap-3">
              {NETWORKS.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNetworkSelect(n.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition text-left"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: n.bg, color: n.color }}
                  >
                    {n.label[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{n.label}</div>
                    <div className="text-xs text-gray-400">{n.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: enter phone */}
        {step === 'phone' && net && (
          <form onSubmit={handleSubmit} className="px-6 py-5">
            {/* Network badge + change */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs font-medium"
              style={{ backgroundColor: net.bg, color: net.color }}
            >
              {net.label}
              <button
                type="button"
                onClick={() => { setStep('select'); setPhone('') }}
                className="ml-auto underline opacity-70 hover:opacity-100"
                style={{ color: net.color }}
              >
                Change
              </button>
            </div>

            <label className="block text-sm text-gray-600 mb-1">Mobile number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0971 234 567"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 mb-1"
              autoFocus
            />
            <p className="text-xs text-gray-400 mb-4">
              You will receive a USSD prompt on your phone to confirm K{confirmedAmount}.
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
            >
              Pay K{confirmedAmount} →
            </button>
          </form>
        )}

        {/* Step: waiting / polling */}
        {step === 'waiting' && (
          <div className="px-6 py-10 text-center">
            <div className="text-3xl mb-4 animate-pulse">📱</div>
            <p className="text-sm font-medium text-gray-800 mb-1">Waiting for your confirmation</p>
            <p className="text-xs text-gray-500 mb-4">
              Approve the {net?.label ?? 'mobile money'} prompt on your phone to complete payment.
            </p>
            {/* Subtle progress dots */}
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'var(--color-primary-mid)',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step: success */}
        {step === 'success' && (
          <div className="px-6 py-10 text-center">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-sm font-medium text-gray-800 mb-1">Payment confirmed!</p>
            <p className="text-xs text-gray-500">Unlocking your lesson…</p>
          </div>
        )}

        {/* Step: failed */}
        {step === 'failed' && (
          <div className="px-6 py-5">
            <div className="text-center mb-4">
              <div className="text-3xl mb-3">❌</div>
              <p className="text-sm font-medium text-gray-800 mb-1">Payment unsuccessful</p>
            </div>
            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setStep('select'); setPhone(''); setError(''); setTxId(null) }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const params  = useParams()
  const router  = useRouter()

  const [lesson, setLesson]             = useState(null)
  const [user, setUser]                 = useState(null)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)

  const lessonId = params?.id
  const subject  = params?.subject ? decodeURIComponent(params.subject) : ''

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      const { data: lessonData, error } = await supabase
        .from('lessons')
        .select(`
          id, title, subject, form_level, price,
          duration_seconds, purchase_count, created_at,
          status, description, cloudflare_video_id,
          tutor_id,
          tutors (
            id, avg_rating, total_reviews, subjects,
            profiles ( full_name, avatar_url )
          )
        `)
        .eq('id', lessonId)
        .eq('status', 'active')
        .single()

      if (error || !lessonData) {
        router.replace(`/browse/${encodeURIComponent(subject)}`)
        return
      }

      setLesson(lessonData)

      if (u) {
        const { data: purchase } = await supabase
          .from('lesson_purchases')
          .select('id')
          .eq('student_id', u.id)
          .eq('lesson_id', lessonId)
          .maybeSingle()
        setHasPurchased(!!purchase)
      }

      setLoading(false)
    }

    if (lessonId) load()
  }, [lessonId, subject, router])

  function handlePaymentSuccess() {
    setShowModal(false)
    setHasPurchased(true)
    // Optimistically bump purchase count for display
    setLesson(l => ({ ...l, purchase_count: (l.purchase_count ?? 0) + 1 }))
  }

  function handleBuyClick() {
    if (!user) {
      router.push(`/auth/login?redirectTo=/browse/${encodeURIComponent(subject)}/lesson/${lessonId}`)
      return
    }
    setShowModal(true)
  }

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-2/3 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse mt-6" />
      </div>
    </div>
  )

  if (!lesson) return null

  const tutor     = lesson.tutors
  const tutorName = tutor?.profiles?.full_name ?? 'Tutor'
  const tutorInit = tutorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const avatarUrl = tutor?.profiles?.avatar_url ?? null
  const duration  = formatDuration(lesson.duration_seconds)
  const rating    = tutor?.avg_rating?.toFixed(1) ?? null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Breadcrumb */}
      <div className="px-6 pt-6 pb-0 max-w-4xl mx-auto">
        <nav className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-gray-600">Browse</Link>
          <span>/</span>
          <Link href={`/browse/${encodeURIComponent(lesson.subject)}`} className="hover:text-gray-600">
            {lesson.subject}
          </Link>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-xs">{lesson.title}</span>
        </nav>
      </div>

      {/* Page layout */}
      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Title block */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}
              >
                {lesson.form_level ?? 'All levels'}
              </span>
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-accent)' }}
              >
                {lesson.subject}
              </span>
            </div>

            <h1
              className="font-serif text-3xl leading-snug mb-2"
              style={{ color: 'var(--color-primary)' }}
            >
              {lesson.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              {duration && <span>⏱ {duration}</span>}
              <span>{lesson.purchase_count ?? 0} student{lesson.purchase_count !== 1 ? 's' : ''} enrolled</span>
              <span>Added {formatDate(lesson.created_at)}</span>
            </div>
          </div>

          {/* Video player / locked state */}
          <div
            className="rounded-2xl overflow-hidden border border-gray-200"
            style={{ aspectRatio: '16/9', backgroundColor: 'var(--color-primary)' }}
          >
            {hasPurchased && lesson.cloudflare_video_id ? (
              <iframe
                src={`https://iframe.cloudflarestream.com/${lesson.cloudflare_video_id}`}
                className="w-full h-full"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'radial-gradient(ellipse at 30% 50%, var(--color-accent-lit) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, var(--color-surface-mid) 0%, transparent 60%)',
                  }}
                />
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4 relative z-10"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  🔒
                </div>
                <p className="text-sm font-medium relative z-10 mb-1" style={{ color: 'var(--color-surface-mid)' }}>
                  {hasPurchased ? 'Video coming soon' : 'Purchase to unlock this lesson'}
                </p>
                {!hasPurchased && (
                  <p className="text-xs relative z-10 opacity-60" style={{ color: 'var(--color-surface-mid)' }}>
                    K{lesson.price} · one-time payment via mobile money
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {lesson.description && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-serif text-lg mb-3" style={{ color: 'var(--color-primary)' }}>
                About this lesson
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {lesson.description}
              </p>
            </div>
          )}

          {/* Tutor card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-4" style={{ color: 'var(--color-primary)' }}>
              About the tutor
            </h2>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={tutorName}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}
                >
                  {tutorInit}
                </div>
              )}
              <div>
                <Link
                  href={`/tutor/${tutor?.id}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {tutorName}
                </Link>
                {tutor?.subjects?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {tutor.subjects.slice(0, 3).join(' · ')}
                  </p>
                )}
                {rating && (
                  <p className="text-xs text-gray-400 mt-1">
                    ★ {rating} · {tutor.total_reviews ?? 0} review{tutor.total_reviews !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">

            {/* Price block */}
            <div
              className="px-6 py-5 border-b border-gray-100"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              {hasPurchased ? (
                <>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-primary-lit)' }}>
                    ✓ You own this lesson
                  </div>
                  <div className="font-serif text-3xl" style={{ color: 'var(--color-primary)' }}>
                    Unlocked
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs text-gray-500 mb-1">One-time purchase</div>
                  <div className="font-serif text-3xl" style={{ color: 'var(--color-primary)' }}>
                    K{lesson.price}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-5 space-y-3">

              {/* CTA button */}
              {hasPurchased ? (
                <div
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-center"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}
                >
                  {lesson.cloudflare_video_id ? '▶ Watch above' : 'Video coming soon'}
                </div>
              ) : (
                <button
                  onClick={handleBuyClick}
                  className="w-full py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}
                >
                  Buy — K{lesson.price}
                </button>
              )}

              {!user && !hasPurchased && (
                <p className="text-xs text-center text-gray-400">
                  <Link href="/auth/login" className="underline" style={{ color: 'var(--color-primary-lit)' }}>
                    Sign in
                  </Link>{' '}or{' '}
                  <Link href="/auth/register" className="underline" style={{ color: 'var(--color-primary-lit)' }}>
                    create an account
                  </Link>{' '}
                  to purchase.
                </p>
              )}

              {/* What you get */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
                  What you get
                </p>
                {[
                  duration ? `${duration} of video content` : 'Full video lesson',
                  'Lifetime access',
                  'Study at your own pace',
                  `Covers ${lesson.form_level ?? lesson.subject}`,
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 text-xs text-gray-600">
                    <span style={{ color: 'var(--color-primary-lit)' }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>

              {/* Payment networks */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-2">Pay via mobile money</p>
                <div className="flex flex-wrap gap-1.5">
                  {NETWORKS.map(n => (
                    <span
                      key={n.id}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ backgroundColor: n.bg + '22', color: n.bg === '#ffc107' ? '#7a5c00' : n.bg }}
                    >
                      {n.label}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Payment modal */}
      {showModal && (
        <PaymentModal
          lesson={lesson}
          onClose={() => setShowModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

    </div>
  )
}
