'use client'
// components/practice/Recorder.js
//
// In-browser recorder for IELTS Speaking. Flow:
//   (optional prep countdown) -> allow mic -> record (timer + live level) ->
//   stop -> listen back -> re-record or send.
// On send it: (1) creates a submission with an empty payload, (2) uploads the
// recorded blob to /api/submissions/:id/audio, (3) triggers grading, then
// routes to the result page. Handles unsupported browsers, denied permission,
// no microphone and a busy microphone with plain-words messages.
//
// Props: { itemId, maxSeconds = 120, prepSeconds = 0 }
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, Hourglass, Loader2, Mic, MicOff, RotateCcw, Send, Square,
} from 'lucide-react'

const MIN_SECONDS = 2

function fmt(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return options.find((t) => MediaRecorder.isTypeSupported(t)) || ''
}

// Each problem gets a title and a "what to do" line.
const PROBLEMS = {
  unsupported: {
    title: 'This browser cannot record audio',
    body: 'Open this page in an up-to-date Chrome, Edge, Firefox or Safari. On a phone, use Chrome (Android) or Safari (iPhone).',
  },
  insecure: {
    title: 'Recording needs a secure page',
    body: 'The microphone only works on pages that start with https://. Open the secure version of this site and try again.',
  },
  denied: {
    title: 'Microphone access is blocked',
    body: 'Tap the lock or settings icon next to the web address, set Microphone to “Allow”, then reload this page. On a phone, also check that your browser is allowed to use the microphone in your phone settings.',
  },
  nomic: {
    title: 'No microphone found',
    body: 'Connect a microphone or headset (earphones with a mic work well), then try again.',
  },
  busy: {
    title: 'Your microphone is being used by another app',
    body: 'Close other apps or tabs that might be using it — calls, voice notes, video meetings — then try again.',
  },
  generic: {
    title: 'We could not start the microphone',
    body: 'Check that a microphone is connected and allowed for this site, then try again.',
  },
}

function problemFromError(err) {
  const name = err?.name
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'nomic'
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'busy'
  return 'generic'
}

function friendlySendError(status, step) {
  if (status === 401) return 'You have been signed out. Sign in again, then record your answer again.'
  if (status === 0) return 'No internet connection. Check your data or Wi-Fi, then press “Send for feedback” again.'
  if (status === 413) return 'This recording is too large to send. Please record a shorter answer.'
  if (step === 'upload') return 'We could not upload your recording. Please press “Send for feedback” again.'
  if (step === 'grade') return 'We could not mark your answer just now. Please press “Send for feedback” again in a minute.'
  return 'Something went wrong while sending. Please try again.'
}

function LevelBars({ level, active }) {
  // 5 bars that light up with the input level (0..1).
  const bars = [0.08, 0.2, 0.35, 0.5, 0.7]
  return (
    <div className="flex h-6 items-end gap-1" aria-hidden="true">
      {bars.map((t, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full transition-all duration-75 ${active && level > t ? 'bg-emerald-500' : 'bg-ink-200'}`}
          style={{ height: `${8 + i * 4}px` }}
        />
      ))}
    </div>
  )
}

export default function Recorder({ itemId, maxSeconds = 120, prepSeconds = 0 }) {
  const router = useRouter()

  // 'idle' | 'prep' | 'requesting' | 'recording' | 'recorded' | 'sending'
  const [phase, setPhase] = useState('idle')
  const [sendStep, setSendStep] = useState(null) // create | upload | grade
  const [problem, setProblem] = useState(null)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [prepLeft, setPrepLeft] = useState(prepSeconds)
  const [level, setLevel] = useState(0)
  const [heardSound, setHeardSound] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [duration, setDuration] = useState(0)

  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const blobRef = useRef(null)
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)
  const audioCtxRef = useRef(null)
  const rafRef = useRef(null)
  const urlRef = useRef(null)
  const pendingRef = useRef(null) // { id, uploaded } — reuse on retry

  // Detect unsupported browsers up front so the student is told before trying.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.isSecureContext === false) setProblem('insecure')
    else if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') setProblem('unsupported')
  }, [])

  const stopMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setLevel(0)
  }, [])

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  // Clean up everything on unmount.
  useEffect(() => () => {
    clearTimer()
    stopMeter()
    stopStream()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    const r = recorderRef.current
    if (r && r.state !== 'inactive') { r.onstop = null; try { r.stop() } catch {} }
  }, [clearTimer, stopMeter, stopStream])

  // Prep countdown (Part 2).
  useEffect(() => {
    if (phase !== 'prep') return
    if (prepLeft <= 0) { setPhase('idle'); return }
    const t = setTimeout(() => setPrepLeft((p) => p - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, prepLeft])

  function startMeter(stream) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      audioCtxRef.current = ctx
      const buf = new Uint8Array(analyser.fftSize)
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
        const rms = Math.sqrt(sum / buf.length)
        const lvl = Math.min(1, rms * 4)
        setLevel(lvl)
        if (lvl > 0.12) setHeardSound(true)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // The level meter is a nice-to-have; recording still works without it.
    }
  }

  function stopRecording() {
    clearTimer()
    const r = recorderRef.current
    if (r && r.state !== 'inactive') r.stop()
  }

  async function startRecording() {
    setError(null)
    setProblem(null)
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null }
    setAudioUrl(null)
    blobRef.current = null
    chunksRef.current = []
    pendingRef.current = null
    setHeardSound(false)

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setProblem('unsupported')
      return
    }

    setPhase('requesting')
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
    } catch (err) {
      setProblem(problemFromError(err))
      setPhase('idle')
      return
    }

    streamRef.current = stream
    const mimeType = pickMimeType()
    let recorder
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    } catch {
      try { recorder = new MediaRecorder(stream) } catch {
        stopStream()
        setProblem('unsupported')
        setPhase('idle')
        return
      }
    }
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const type = (recorder.mimeType || mimeType || 'audio/webm').split(';')[0]
      const blob = new Blob(chunksRef.current, { type })
      blobRef.current = blob
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setAudioUrl(url)
      setDuration((Date.now() - startedAtRef.current) / 1000)
      stopMeter()
      stopStream()
      setPhase('recorded')
    }

    startMeter(stream)
    recorder.start(250)
    startedAtRef.current = Date.now()
    setElapsed(0)
    setPhase('recording')
    timerRef.current = setInterval(() => {
      const secs = (Date.now() - startedAtRef.current) / 1000
      setElapsed(secs)
      if (secs >= maxSeconds) stopRecording()
    }, 250)
  }

  function reRecord() {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null }
    setAudioUrl(null)
    blobRef.current = null
    chunksRef.current = []
    pendingRef.current = null
    setElapsed(0)
    setDuration(0)
    setError(null)
    setPhase('idle')
  }

  async function send() {
    if (!blobRef.current || blobRef.current.size === 0) {
      setError('We did not capture any sound. Please record your answer again.')
      return
    }
    setError(null)
    setPhase('sending')
    let step = 'create'
    try {
      let id = pendingRef.current?.id
      if (!id) {
        setSendStep('create')
        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ practice_item_id: itemId, payload: {} }),
        })
        if (!res.ok) throw Object.assign(new Error('create'), { status: res.status })
        const { submission } = await res.json()
        id = submission.id
        pendingRef.current = { id, uploaded: false }
      }

      if (!pendingRef.current.uploaded) {
        step = 'upload'
        setSendStep('upload')
        const up = await fetch(`/api/submissions/${id}/audio`, {
          method: 'POST',
          headers: { 'Content-Type': blobRef.current.type || 'audio/webm' },
          body: blobRef.current,
        })
        if (!up.ok) throw Object.assign(new Error('upload'), { status: up.status })
        pendingRef.current.uploaded = true
      }

      step = 'grade'
      setSendStep('grade')
      const g = await fetch(`/api/submissions/${id}/grade`, { method: 'POST' })
      if (!g.ok) throw Object.assign(new Error('grade'), { status: g.status })

      router.push(`/practice/speaking/${itemId}/result/${id}`)
    } catch (err) {
      setError(friendlySendError(err?.status ?? 0, step))
      setPhase('recorded')
      setSendStep(null)
    }
  }

  const blocked = problem === 'unsupported' || problem === 'insecure'
  const recording = phase === 'recording'
  const pct = Math.min(100, (elapsed / maxSeconds) * 100)
  const tooShort = phase === 'recorded' && duration < MIN_SECONDS
  const sendLabel = sendStep === 'grade' ? 'Listening to your answer…' : 'Sending your recording…'

  return (
    <div className="card overflow-hidden">
      <div className="card-pad">
        {/* Status line */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            {phase === 'prep' ? 'Preparation time'
              : recording ? 'Recording'
              : phase === 'recorded' || phase === 'sending' ? 'Your recording'
              : 'Recorder'}
          </p>
          {recording ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
              </span>
              Recording
            </span>
          ) : null}
        </div>

        {/* Main control area */}
        {phase === 'prep' ? (
          <div className="mt-4 flex flex-col items-center text-center" role="timer" aria-live="off">
            <Hourglass className="h-6 w-6 text-sun-500" aria-hidden="true" />
            <p className="mt-2 font-display text-5xl font-bold tabular-nums text-ink-900">{fmt(prepLeft)}</p>
            <p className="mt-2 max-w-xs text-sm text-ink-500">Think about what you will say for each point on the card. You can make short notes on paper.</p>
            <button type="button" className="btn-primary btn-lg mt-5" onClick={() => { setPhase('idle'); startRecording() }}>
              <Mic className="h-5 w-5" aria-hidden="true" /> I’m ready — start recording
            </button>
          </div>
        ) : phase === 'recorded' || phase === 'sending' ? (
          <div className="mt-4">
            {audioUrl ? (
              <audio controls src={audioUrl} className="w-full" preload="metadata">
                Your browser cannot play the recording back, but you can still send it.
              </audio>
            ) : null}
            <p className="mt-2 text-sm text-ink-500">
              Length {fmt(duration)}. Listen back — if you are happy, send it. If not, record again.
            </p>
            {tooShort ? (
              <p className="mt-3 rounded-xl bg-sun-50 px-4 py-3 text-sm text-ink-700">
                That recording is very short. Record again and speak for longer to get useful feedback.
              </p>
            ) : !heardSound && phase === 'recorded' ? (
              <p className="mt-3 rounded-xl bg-sun-50 px-4 py-3 text-sm text-ink-700">
                We did not hear much sound. Play it back to check your microphone picked you up.
              </p>
            ) : null}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary btn-lg" onClick={reRecord} disabled={phase === 'sending'}>
                <RotateCcw className="h-5 w-5" aria-hidden="true" /> Record again
              </button>
              <button type="button" className="btn-primary btn-lg" onClick={send} disabled={phase === 'sending' || tooShort}>
                {phase === 'sending'
                  ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> {sendLabel}</>
                  : <><Send className="h-5 w-5" aria-hidden="true" /> Send for feedback</>}
              </button>
            </div>
            {phase === 'sending' ? (
              <p role="status" className="mt-3 text-center text-sm text-ink-500 sm:text-right">This usually takes a few seconds. Please keep this page open.</p>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center text-center">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={blocked || phase === 'requesting'}
              aria-label={recording ? 'Stop recording' : 'Start recording'}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lift transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                recording ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-300' : 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-300'
              }`}
            >
              {recording ? (
                <span
                  className="pointer-events-none absolute inset-0 rounded-full ring-rose-300 transition-all duration-75"
                  style={{ boxShadow: `0 0 0 ${Math.round(level * 18)}px rgba(244,63,94,0.18)` }}
                  aria-hidden="true"
                />
              ) : null}
              {phase === 'requesting'
                ? <Loader2 className="h-9 w-9 animate-spin" aria-hidden="true" />
                : recording ? <Square className="h-8 w-8 fill-current" aria-hidden="true" />
                : blocked ? <MicOff className="h-9 w-9" aria-hidden="true" />
                : <Mic className="h-9 w-9" aria-hidden="true" />}
            </button>

            <p className="mt-4 font-display text-4xl font-bold tabular-nums text-ink-900" aria-live="off">
              {fmt(elapsed)}
              <span className="ml-1 text-lg font-medium text-ink-300">/ {fmt(maxSeconds)}</span>
            </p>

            {recording ? (
              <>
                <div className="mt-3 flex items-center gap-3">
                  <LevelBars level={level} active />
                  <span className="text-sm text-ink-500">{heardSound ? 'We can hear you' : 'Start speaking…'}</span>
                </div>
                <div className="progress-track mt-4 h-1.5 max-w-xs" aria-hidden="true">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-3 text-sm text-ink-500">Press the square to stop. Recording stops by itself at {fmt(maxSeconds)}.</p>
              </>
            ) : phase === 'requesting' ? (
              <p className="mt-2 text-sm text-ink-500" role="status">Your browser is asking to use the microphone. Choose <strong className="font-semibold text-ink-700">Allow</strong>.</p>
            ) : blocked ? null : (
              <>
                <p className="mt-2 text-sm text-ink-500">Press the microphone to start. Your browser will ask to use it — choose <strong className="font-semibold text-ink-700">Allow</strong>.</p>
                {prepSeconds > 0 ? (
                  <button type="button" className="btn-secondary btn-sm mt-4" onClick={() => { setPrepLeft(prepSeconds); setPhase('prep') }}>
                    <Hourglass className="h-4 w-4" aria-hidden="true" /> Start {fmt(prepSeconds)} preparation first
                  </button>
                ) : null}
              </>
            )}
          </div>
        )}

        {problem ? (
          <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <MicOff className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-rose-800">{PROBLEMS[problem].title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">{PROBLEMS[problem].body}</p>
              {!blocked ? (
                <button type="button" className="btn-secondary btn-sm mt-3" onClick={startRecording}>Try again</button>
              ) : null}
            </div>
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="mt-4 flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
