// app/browse/[subject]/lesson/[id]/page.js
'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'

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

function extractYouTubeId(input) {
  if (!input) return null
  // Already a bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input
  // Full URL: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
  try {
    const url = new URL(input)
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('/')[0] || null
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v')
      if (v) return v
      const parts = url.pathname.split('/')
      if (parts[1] === 'embed' && parts[2]) return parts[2]
    }
  } catch {}
  return null
}

const NETWORKS = [
  { id: 'airtel', label: 'Airtel Money',   hint: 'Numbers starting 097 or 096', bg: '#d00000', color: '#fff'    },
  { id: 'mtn',    label: 'MTN MoMo',       hint: 'Numbers starting 076 or 077', bg: '#ffc107', color: '#1a1a1a' },
  { id: 'zamtel', label: 'Zamtel Kwacha',  hint: 'Numbers starting 075',        bg: '#00843d', color: '#fff'    },
]

function PaymentModal({ lesson, onClose, onSuccess }) {
  const [step, setStep]                     = useState('select')
  const [network, setNetwork]               = useState(null)
  const [phone, setPhone]                   = useState('')
  const [error, setError]                   = useState('')
  const [txId, setTxId]                     = useState(null)
  const [confirmedAmount, setConfirmedAmount] = useState(lesson.price)
  const pollRef                             = useRef(null)
  const mountedRef                          = useRef(true)

  useEffect(() => () => { mountedRef.current = false; clearTimeout(pollRef.current) }, [])

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

    try {
      const res = await fetch('/api/payment/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: cleaned, lessonId: lesson.id }),
      })

      const data = await res.json()

      if (!res.ok || !data.transactionId) {
        setError(data.error ?? 'Could not initiate payment. Please try again.')
        setStep('phone')
        return
      }

      if (data.amount) setConfirmedAmount(data.amount)
      setTxId(data.transactionId)
      scheduleVerify(data.transactionId, 0)
    } catch {
      setError('Network error. Please check your connection and try again.')
      setStep('phone')
    }
  }

  function scheduleVerify(transactionId, count) {
    if (count >= 20) {
      setStep('failed')
      setError('Payment timed out. If your money was deducted, please contact support.')
      return
    }

    pollRef.current = setTimeout(async () => {
      if (!mountedRef.current) return
      try {
        const res = await fetch('/api/payment/verify', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ transactionId, lessonId: lesson.id }),
        })

        if (!mountedRef.current) return
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

        scheduleVerify(transactionId, count + 1)
      } catch {
        if (!mountedRef.current) return
        scheduleVerify(transactionId, count + 1)
      }
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

        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>
                Purchase lesson
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{lesson.title}</p>
            </div>
            {step !== 'waiting' && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-4 mt-0.5">✕</button>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Amount due</span>
            <span className="font-serif text-2xl" style={{ color: 'var(--color-primary)' }}>
              K{confirmedAmount}
            </span>
          </div>
        </div>

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
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: n.bg, color: n.color }}>
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

        {step === 'phone' && net && (
          <form onSubmit={handleSubmit} className="px-6 py-5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs font-medium"
              style={{ backgroundColor: net.bg, color: net.color }}>
              {net.label}
              <button type="button" onClick={() => { setStep('select'); setPhone('') }}
                className="ml-auto underline opacity-70 hover:opacity-100" style={{ color: net.color }}>
                Change
              </button>
            </div>

            <label className="block text-sm text-gray-600 mb-1">Mobile number</label>
            <input
              type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="0971 234 567"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 mb-1"
              autoFocus
            />
            <p className="text-xs text-gray-400 mb-4">
              You will receive a USSD prompt on your phone to confirm K{confirmedAmount}.
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>
            )}

            <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              Pay K{confirmedAmount} →
            </button>
          </form>
        )}

        {step === 'waiting' && (
          <div className="px-6 py-10 text-center">
            <div className="text-3xl mb-4 animate-pulse">📱</div>
            <p className="text-sm font-medium text-gray-800 mb-1">Waiting for your confirmation</p>
            <p className="text-xs text-gray-500 mb-4">
              Approve the {net?.label ?? 'mobile money'} prompt on your phone to complete payment.
            </p>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--color-primary-mid)', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="px-6 py-10 text-center">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-sm font-medium text-gray-800 mb-1">Payment confirmed!</p>
            <p className="text-xs text-gray-500">Unlocking your lesson…</p>
          </div>
        )}

        {step === 'failed' && (
          <div className="px-6 py-5">
            <div className="text-center mb-4">
              <div className="text-3xl mb-3">❌</div>
              <p className="text-sm font-medium text-gray-800 mb-1">Payment unsuccessful</p>
            </div>
            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-4">{error}</div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setStep('select'); setPhone(''); setError(''); setTxId(null) }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                Try again
              </button>
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LessonPage() {
  const params  = useParams()
  const router  = useRouter()

  const [lesson, setLesson]             = useState(null)
  const [user, setUser]                 = useState(null)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [isTheater, setIsTheater]       = useState(false)

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
            profiles!user_id ( full_name, avatar_url )
          )
        `)
        .eq('id', lessonId)
        .eq('status', 'active')
        .or('flagged.is.null,flagged.eq.false')
        .single()

      if (error || !lessonData) {
        router.replace(`/browse/${encodeURIComponent(subject)}`)
        return
      }

      setLesson(lessonData)

      if (u) {
        // Tutor who owns this lesson can always preview it
        const { data: ownerTutor } = await supabase
          .from('tutors').select('id').eq('user_id', u.id).maybeSingle()
        if (ownerTutor && lessonData.tutor_id === ownerTutor.id) {
          setHasPurchased(true)
        } else {
          const { data: purchase } = await supabase
            .from('lesson_purchases')
            .select('id')
            .eq('student_id', u.id)
            .eq('lesson_id', lessonId)
            .maybeSingle()
          setHasPurchased(!!purchase)
        }
      }

      setLoading(false)
    }

    if (lessonId) load()
  }, [lessonId, subject, router])

  // Realtime cross-tab sync — if the user pays in another tab, this tab unlocks too
  useEffect(() => {
    if (!user || hasPurchased || !lessonId) return

    const channel = supabase
      .channel(`purchase-sync-${lessonId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'lesson_purchases',
          filter: `lesson_id=eq.${lessonId}`,
        },
        (payload) => {
          if (payload.new?.student_id === user.id) {
            setHasPurchased(true)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, hasPurchased, lessonId])

  function handlePaymentSuccess() {
    setShowModal(false)
    setHasPurchased(true)
    setLesson(l => ({ ...l, purchase_count: (l.purchase_count ?? 0) + 1 }))
  }

  // Keyboard shortcuts: T = theater, Esc = exit theater
  useEffect(() => {
    if (!hasPurchased) return
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.key === 't' || e.key === 'T') setIsTheater(t => !t)
      if (e.key === 'Escape' && isTheater) setIsTheater(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasPurchased, isTheater])

  function handleBuyClick() {
    if (!user) {
      router.push(`/auth/login?redirectTo=/browse/${encodeURIComponent(subject)}/lesson/${lessonId}`)
      return
    }
    setShowModal(true)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-4">
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
  const tutorInit = tutorName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const avatarUrl = tutor?.profiles?.avatar_url ?? null
  const duration  = formatDuration(lesson.duration_seconds)
  const rating    = tutor?.avg_rating?.toFixed(1) ?? null

  function VideoPlayer() {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [showRateMenu, setShowRateMenu] = useState(false)
    const [playing, setPlaying]           = useState(false)
    const [ended, setEnded]               = useState(false)
    const [currentTime, setCurrentTime]   = useState(0)
    const [videoDuration, setVideoDuration] = useState(0)
    const [showControls, setShowControls] = useState(true)
    const [seeking, setSeeking]           = useState(false)
    const [volume, setVolume]             = useState(1)
    const [muted, setMuted]              = useState(false)

    const containerRef = useRef(null)
    const ytPlayerRef  = useRef(null)
    const streamRef    = useRef(null)
    const ytDivRef     = useRef(null)
    const hideTimer    = useRef(null)
    const pollTimer    = useRef(null)

    const ytId = extractYouTubeId(lesson.cloudflare_video_id)
    const cfId = !ytId ? lesson.cloudflare_video_id.replace(/-/g, '') : null
    const isCf = cfId && /^[a-fA-F0-9]{32,}$/.test(cfId)

    // Format seconds as m:ss or h:mm:ss
    function fmtTime(s) {
      if (!s || isNaN(s)) return '0:00'
      const secs = Math.floor(s)
      const h = Math.floor(secs / 3600)
      const m = Math.floor((secs % 3600) / 60)
      const sec = secs % 60
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      return `${m}:${String(sec).padStart(2, '0')}`
    }

    // ── YouTube IFrame Player API ───────────────────────────────
    useEffect(() => {
      if (!ytId) return
      let player = null

      function onReady(e) {
        ytPlayerRef.current = e.target
        setVideoDuration(e.target.getDuration())
      }

      function onStateChange(e) {
        // YT states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering
        setPlaying(e.data === 1 || e.data === 3)
        setEnded(e.data === 0)
        if (e.data === 1) {
          setVideoDuration(ytPlayerRef.current?.getDuration() || 0)
        }
      }

      function createPlayer() {
        if (!window.YT?.Player || !ytDivRef.current) return
        player = new window.YT.Player(ytDivRef.current, {
          videoId: ytId,
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: { onReady, onStateChange },
        })
      }

      if (window.YT?.Player) {
        createPlayer()
      } else {
        window.onYouTubeIframeAPIReady = createPlayer
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement('script')
          tag.src = 'https://www.youtube.com/iframe_api'
          document.head.appendChild(tag)
        }
      }

      return () => { if (player?.destroy) player.destroy(); ytPlayerRef.current = null }
    }, [ytId])

    // ── Cloudflare Stream element ───────────────────────────────
    useEffect(() => {
      if (!isCf) return
      // Load Cloudflare Stream SDK
      if (!document.querySelector('script[src*="cloudflarestream.com/embed/sdk"]')) {
        const tag = document.createElement('script')
        tag.src = 'https://embed.cloudflarestream.com/embed/sdk.latest.js'
        tag.defer = true
        document.head.appendChild(tag)
      }

      function bindStream() {
        const el = streamRef.current
        if (!el) return
        el.addEventListener('play', () => { setPlaying(true); setEnded(false) })
        el.addEventListener('pause', () => setPlaying(false))
        el.addEventListener('ended', () => { setPlaying(false); setEnded(true) })
        el.addEventListener('loadedmetadata', () => setVideoDuration(el.duration || 0))
        el.addEventListener('timeupdate', () => { if (!seeking) setCurrentTime(el.currentTime || 0) })
      }

      // Wait for element to be ready
      const check = setInterval(() => {
        if (streamRef.current) { bindStream(); clearInterval(check) }
      }, 200)
      return () => clearInterval(check)
    }, [isCf, seeking])

    // ── Poll YouTube time (no timeupdate event on iframe) ───────
    useEffect(() => {
      if (!ytId) return
      pollTimer.current = setInterval(() => {
        const p = ytPlayerRef.current
        if (p?.getCurrentTime && !seeking) {
          setCurrentTime(p.getCurrentTime())
        }
      }, 250)
      return () => clearInterval(pollTimer.current)
    }, [ytId, seeking])

    // ── Fullscreen ──────────────────────────────────────────────
    function toggleFullscreen() {
      if (!containerRef.current) return
      if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => {})
      else document.exitFullscreen().catch(() => {})
    }

    useEffect(() => {
      function onFsChange() { setIsFullscreen(!!document.fullscreenElement) }
      document.addEventListener('fullscreenchange', onFsChange)
      return () => document.removeEventListener('fullscreenchange', onFsChange)
    }, [])

    // ── Auto-hide controls ──────────────────────────────────────
    function onMouseMove() {
      setShowControls(true)
      clearTimeout(hideTimer.current)
      if (playing) {
        hideTimer.current = setTimeout(() => setShowControls(false), 3000)
      }
    }

    useEffect(() => {
      if (!playing) setShowControls(true)
    }, [playing])

    // ── Player actions ──────────────────────────────────────────
    function togglePlay() {
      if (ended) { replay(); return }
      if (ytId) {
        const p = ytPlayerRef.current
        if (!p) return
        playing ? p.pauseVideo() : p.playVideo()
      } else {
        const el = streamRef.current
        if (!el) return
        playing ? el.pause() : el.play()
      }
    }

    function seekTo(time) {
      const t = Math.max(0, Math.min(time, videoDuration))
      setCurrentTime(t)
      if (ytId) ytPlayerRef.current?.seekTo(t, true)
      else if (streamRef.current) streamRef.current.currentTime = t
    }

    function skip(delta) {
      seekTo(currentTime + delta)
    }

    function changeRate(rate) {
      setPlaybackRate(rate)
      setShowRateMenu(false)
      if (ytId) ytPlayerRef.current?.setPlaybackRate(rate)
      else if (streamRef.current) streamRef.current.playbackRate = rate
    }

    function replay() {
      setEnded(false)
      seekTo(0)
      if (ytId) ytPlayerRef.current?.playVideo()
      else streamRef.current?.play()
    }

    function changeVolume(val) {
      const v = Math.max(0, Math.min(1, val))
      setVolume(v)
      setMuted(v === 0)
      if (ytId) ytPlayerRef.current?.setVolume(v * 100)
      else if (streamRef.current) { streamRef.current.volume = v; streamRef.current.muted = v === 0 }
    }

    function toggleMute() {
      if (muted) {
        const restore = volume > 0 ? volume : 0.5
        setMuted(false)
        if (ytId) { ytPlayerRef.current?.unMute(); ytPlayerRef.current?.setVolume(restore * 100) }
        else if (streamRef.current) { streamRef.current.muted = false; streamRef.current.volume = restore }
      } else {
        setMuted(true)
        if (ytId) ytPlayerRef.current?.mute()
        else if (streamRef.current) streamRef.current.muted = true
      }
    }

    function onBarClick(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      seekTo(pct * videoDuration)
    }

    // ── Locked state ────────────────────────────────────────────
    if (!hasPurchased || !lesson.cloudflare_video_id) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(ellipse at 30% 50%, var(--color-accent-lit) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, var(--color-surface-mid) 0%, transparent 60%)' }} />
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4 relative z-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
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
      )
    }

    if (!ytId && !isCf) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-sm text-gray-400">No video ID or valid format found</p>
        </div>
      )
    }

    const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0
    const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

    return (
      <div ref={containerRef} className="relative w-full h-full bg-black select-none"
        onMouseMove={onMouseMove} onMouseLeave={() => { if (playing) setShowControls(false) }}>

        {/* Video element */}
        {ytId ? (
          <div ref={ytDivRef} className="w-full h-full" />
        ) : (
          <stream ref={streamRef} src={cfId}
            className="w-full h-full" style={{ display: 'block', width: '100%', height: '100%' }}
            preload="auto" />
        )}

        {/* Center play/pause overlay — click to toggle */}
        <div className="absolute inset-0 z-10" onClick={togglePlay} />

        {/* Replay overlay */}
        {ended && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60">
            <button onClick={replay}
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-3 hover:scale-110 transition-transform"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            <p className="text-white text-sm font-medium">Replay</p>
          </div>
        )}

        {/* Controls overlay */}
        <div className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>

          {/* Progress bar */}
          <div className="px-3 pt-3 group/bar">
            <div className="relative h-1 group-hover/bar:h-1.5 transition-all rounded-full cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              onClick={onBarClick}
              onMouseDown={(e) => {
                setSeeking(true)
                onBarClick(e)
                function onMove(ev) { onBarClick({ currentTarget: e.currentTarget, clientX: ev.clientX }) }
                function onUp() { setSeeking(false); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
                document.addEventListener('mousemove', onMove)
                document.addEventListener('mouseup', onUp)
              }}>
              <div className="absolute top-0 left-0 h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: '#e8c84a' }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, transform: `translateX(-50%) translateY(-50%)`, backgroundColor: '#e8c84a' }} />
            </div>
          </div>

          {/* Button row */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-1">
              {/* Play / Pause */}
              <button onClick={togglePlay} className="text-white p-1.5 rounded hover:bg-white/20 transition" title={playing ? 'Pause' : 'Play'}>
                {playing ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                )}
              </button>

              {/* Skip back 10s */}
              <button onClick={() => skip(-10)} className="text-white p-1.5 rounded hover:bg-white/20 transition" title="Back 10s">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  <text x="12" y="16" fill="white" stroke="none" fontSize="7" fontWeight="bold" textAnchor="middle">10</text>
                </svg>
              </button>

              {/* Skip forward 10s */}
              <button onClick={() => skip(10)} className="text-white p-1.5 rounded hover:bg-white/20 transition" title="Forward 10s">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                  <text x="12" y="16" fill="white" stroke="none" fontSize="7" fontWeight="bold" textAnchor="middle">10</text>
                </svg>
              </button>

              {/* Time display */}
              <span className="text-white text-xs ml-2 tabular-nums">
                {fmtTime(currentTime)} / {fmtTime(videoDuration)}
              </span>

              {/* Volume */}
              <div className="flex items-center gap-1 ml-2 group/vol">
                <button onClick={toggleMute} className="text-white p-1.5 rounded hover:bg-white/20 transition" title={muted ? 'Unmute' : 'Mute'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {muted || volume === 0 ? (
                      <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19" fill="white" stroke="none" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>
                    ) : volume < 0.5 ? (
                      <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19" fill="white" stroke="none" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></>
                    ) : (
                      <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19" fill="white" stroke="none" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>
                    )}
                  </svg>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={e => changeVolume(parseFloat(e.target.value))}
                  className="vol-slider w-0 group-hover/vol:w-20 transition-all duration-200 accent-[#e8c84a] h-1 cursor-pointer opacity-0 group-hover/vol:opacity-100"
                  title={`Volume: ${Math.round((muted ? 0 : volume) * 100)}%`}
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Playback speed */}
              <div className="relative">
                <button onClick={() => setShowRateMenu(o => !o)}
                  className="text-white text-xs px-2 py-1 rounded hover:bg-white/20 transition font-medium">
                  {playbackRate}x
                </button>
                {showRateMenu && (
                  <div className="absolute bottom-full right-0 mb-1 bg-gray-900/95 rounded-lg py-1 shadow-lg backdrop-blur-sm">
                    {RATES.map(r => (
                      <button key={r} onClick={() => changeRate(r)}
                        className="block w-full text-left text-xs px-4 py-1.5 hover:bg-white/10 transition whitespace-nowrap"
                        style={{ color: r === playbackRate ? '#e8c84a' : '#fff' }}>
                        {r}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theater mode */}
              <button onClick={() => setIsTheater(t => !t)}
                className="text-white text-xs px-2 py-1 rounded hover:bg-white/20 transition"
                title={isTheater ? 'Exit theater mode' : 'Theater mode'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {isTheater
                    ? <><rect x="5" y="5" width="14" height="14" rx="2" /></>
                    : <><rect x="2" y="4" width="20" height="16" rx="2" /></>}
                </svg>
              </button>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen}
                className="text-white text-xs px-2 py-1 rounded hover:bg-white/20 transition"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {isFullscreen ? (
                    <><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></>
                  ) : (
                    <><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    // pb-24 on mobile leaves room for the floating buy bar; removed on lg+
    <div className="pb-24 lg:pb-0" style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 pt-6 pb-0 max-w-4xl mx-auto">
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

      {/* Theater mode: full-width video above, then normal layout below */}
      {isTheater && hasPurchased && lesson.cloudflare_video_id && (
        <div className="w-full bg-black" style={{ aspectRatio: '21/9', maxHeight: '75vh' }}>
          <VideoPlayer />
        </div>
      )}

      <div className={`${isTheater ? 'max-w-5xl' : 'max-w-4xl'} mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all`}>

        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                {lesson.form_level ?? 'All levels'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-accent)' }}>
                {lesson.subject}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl leading-snug mb-2" style={{ color: 'var(--color-primary)' }}>
              {lesson.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              {duration && <span>⏱ {duration}</span>}
              <span>{lesson.purchase_count ?? 0} student{lesson.purchase_count !== 1 ? 's' : ''} enrolled</span>
              <span>Added {formatDate(lesson.created_at)}</span>
            </div>
          </div>

          {!isTheater && (
            <div className="rounded-2xl overflow-hidden border border-gray-200"
              style={{ aspectRatio: '16/9', backgroundColor: 'var(--color-primary)' }}>
              <VideoPlayer />
            </div>
          )}

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

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-4" style={{ color: 'var(--color-primary)' }}>
              About the tutor
            </h2>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt={tutorName}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                  {tutorInit}
                </div>
              )}
              <div>
                <Link href={`/tutor/${tutor?.id}`} className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--color-primary)' }}>
                  {tutorName}
                </Link>
                {tutor?.subjects?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">{tutor.subjects.slice(0, 3).join(' · ')}</p>
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

        {/* Right sidebar — desktop only buy button */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100" style={{ backgroundColor: 'var(--color-surface)' }}>
              {hasPurchased ? (
                <>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-primary-lit)' }}>
                    ✓ You own this lesson
                  </div>
                  <div className="font-serif text-3xl" style={{ color: 'var(--color-primary)' }}>Unlocked</div>
                </>
              ) : (
                <>
                  <div className="text-xs text-gray-500 mb-1">One-time purchase</div>
                  <div className="font-serif text-3xl" style={{ color: 'var(--color-primary)' }}>K{lesson.price}</div>
                </>
              )}
            </div>

            <div className="px-6 py-5 space-y-3">
              {hasPurchased ? (
                <div className="w-full py-2.5 rounded-lg text-sm font-medium text-center"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}>
                  {lesson.cloudflare_video_id ? '▶ Watch above' : 'Video coming soon'}
                </div>
              ) : (
                <button onClick={handleBuyClick} className="w-full py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}>
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

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-primary)' }}>What you get</p>
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

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-2">Pay via mobile money</p>
                <div className="flex flex-wrap gap-1.5">
                  {NETWORKS.map(n => (
                    <span key={n.id} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ backgroundColor: n.bg + '22', color: n.bg === '#ffc107' ? '#7a5c00' : n.bg }}>
                      {n.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating buy bar — only shown when lesson is not yet purchased.
          Hidden on desktop (lg+) where the sidebar buy button is visible. */}
      {!hasPurchased && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 py-3"
          style={{
            backgroundColor: 'var(--color-page-bg)',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
          }}>
          <button
            onClick={handleBuyClick}
            className="w-full py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}>
            Buy this lesson — K{lesson.price}
          </button>
        </div>
      )}

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
