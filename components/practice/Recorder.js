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
import { ArrowRight, Loader2, Mic, MicOff, RotateCcw, Square } from 'lucide-react'
import Segments from '@/components/kit/Segments'
import ClipPlayer from '@/components/practice/ClipPlayer'

const MIN_SECONDS = 2
// The live meter draws the last METER_BARS loudness samples, one every
// METER_EVERY animation frames.
const METER_BARS = 48
const METER_EVERY = 5

function fmt(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return options.find((t) => MediaRecorder.isTypeSupported(t)) || ''
}

// Each problem gets a title and a "what to do": one line, or numbered steps.
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
    steps: [
      'Tap the lock or settings icon next to the web address.',
      'Set Microphone to “Allow”.',
      'Reload this page.',
    ],
    body: 'On a phone, also check that your browser is allowed to use the microphone in your phone settings.',
  },
  nomic: {
    title: 'No microphone found',
    body: 'Connect a microphone or headset (earphones with a mic work well), then try again.',
  },
  busy: {
    title: 'Your microphone is being used by another app',
    body: 'Close other apps or tabs that might be using it (calls, voice notes, video meetings), then try again.',
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

// Live level meter: the recent loudness as a row of bars, newest on the right.
// Green while there is sound, a flat grey line while it is quiet.
function LevelMeter({ history }) {
  const pad = Math.max(0, METER_BARS - history.length)
  return (
    <div className="flex h-12 items-center justify-between" aria-hidden="true">
      {Array.from({ length: METER_BARS }, (_, i) => {
        const lvl = i < pad ? null : history[i - pad]
        const loud = lvl !== null && lvl > 0.06
        return (
          <span
            key={i}
            className={`w-[3px] shrink-0 sm:w-1 ${loud ? 'bg-board-600' : lvl === null ? 'bg-ink-200' : 'bg-ink-300'}`}
            style={{ height: loud ? `${Math.max(10, Math.min(100, lvl * 130))}%` : 3 }}
          />
        )
      })}
    </div>
  )
}

const SEND_STEPS = { create: 1, upload: 2, grade: 3 }

export default function Recorder({ itemId, maxSeconds = 120, prepSeconds = 0 }) {
  const router = useRouter()

  // 'idle' | 'prep' | 'requesting' | 'recording' | 'recorded' | 'sending'
  const [phase, setPhase] = useState('idle')
  const [sendStep, setSendStep] = useState(null) // create | upload | grade
  const [problem, setProblem] = useState(null)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [prepLeft, setPrepLeft] = useState(prepSeconds)
  const [history, setHistory] = useState([])
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
      // For the drawn meter: keep the loudest level of each small batch of frames.
      let frames = 0
      let peak = 0
      let samples = []
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
        const rms = Math.sqrt(sum / buf.length)
        const lvl = Math.min(1, rms * 4)
        if (lvl > 0.12) setHeardSound(true)
        peak = Math.max(peak, lvl)
        frames += 1
        if (frames >= METER_EVERY) {
          samples = [...samples.slice(-(METER_BARS - 1)), peak]
          setHistory(samples)
          frames = 0
          peak = 0
        }
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
    setHistory([])

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
  const requesting = phase === 'requesting'
  const sending = phase === 'sending'
  const pct = Math.min(100, (elapsed / maxSeconds) * 100)
  const tooShort = phase === 'recorded' && duration < MIN_SECONDS
  const sendLabel = sendStep === 'grade' ? 'Listening to your answer…' : 'Sending your recording…'
  const info = problem ? PROBLEMS[problem] : null

  return (
    <div className="card p-5 sm:p-8">
      {phase === 'prep' ? (
        /* ── Preparation countdown (Part 2) ── */
        <div role="timer" aria-live="off">
          <p className="text-[13px] font-bold text-copper-700">Preparation time</p>
          <p className="numeral mt-1 text-[4.5rem] leading-none text-ink-900">{fmt(prepLeft)}</p>
          <div className="progress-track mt-4 max-w-xs" aria-hidden="true">
            <div className="h-full rounded-full bg-copper-500" style={{ width: `${prepSeconds ? ((prepSeconds - prepLeft) / prepSeconds) * 100 : 0}%` }} />
          </div>
          <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-ink-600">
            Think about what you will say for each point on the card. You can make short notes on paper. Recording does not start by itself.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-primary btn-lg" onClick={() => { setPhase('idle'); startRecording() }}>
              <Mic className="h-5 w-5" aria-hidden="true" /> I’m ready, start recording
            </button>
            <button type="button" className="btn-ghost btn-lg" onClick={() => setPhase('idle')}>Stop the timer</button>
          </div>
        </div>
      ) : phase === 'recorded' || sending ? (
        /* ── Recorded: listen back, then send or record again ── */
        <div>
          {audioUrl ? (
            <ClipPlayer
              src={audioUrl}
              duration={duration}
              disabled={sending}
              failedText="Your browser cannot play the recording back, but you can still send it."
            />
          ) : null}

          {tooShort ? (
            <p className="mt-5 rounded-lg bg-sun-100 px-4 py-3 text-[15px] leading-relaxed text-ink-800">
              <strong className="font-bold text-ink-900">Too short to mark.</strong>{' '}
              That recording is under {MIN_SECONDS} seconds. Record again and speak for longer to get useful feedback.
            </p>
          ) : !heardSound && phase === 'recorded' ? (
            <p className="mt-5 rounded-lg bg-sun-100 px-4 py-3 text-[15px] leading-relaxed text-ink-800">
              <strong className="font-bold text-ink-900">Very quiet.</strong>{' '}
              We did not hear much sound. Play it back to check your microphone picked you up.
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-[15px] leading-relaxed text-ink-800">
              <strong className="font-bold text-rose-700">Not sent.</strong> {error}
            </p>
          ) : null}

          {sending ? (
            <div role="status" className="mt-6 border-t border-ink-200 pt-5">
              <p className="flex items-center gap-2.5 text-[17px] font-bold text-ink-900">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-board-700" aria-hidden="true" /> {sendLabel}
              </p>
              <Segments total={3} done={SEND_STEPS[sendStep] || 1} className="mt-3 max-w-[200px]" label={`Step ${SEND_STEPS[sendStep] || 1} of 3`} />
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">This usually takes a few seconds. Please keep this page open.</p>
            </div>
          ) : (
            <div className="mt-6 border-t border-ink-200 pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {tooShort ? (
                  <button type="button" className="btn-primary btn-lg" onClick={reRecord}>
                    <RotateCcw className="h-5 w-5" aria-hidden="true" /> Record again
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn-primary btn-lg group" onClick={send}>
                      Send for feedback <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
                    </button>
                    <button type="button" className="btn-secondary btn-lg" onClick={reRecord}>
                      <RotateCcw className="h-5 w-5" aria-hidden="true" /> Record again
                    </button>
                  </>
                )}
              </div>
              {tooShort ? null : (
                <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                  Listen back first. If you are happy with it, send it. If not, record again: the old recording is replaced.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Idle, asking for the microphone, recording ── */
        <div>
          <div className="flex items-center gap-4 sm:gap-5">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={blocked || requesting}
              aria-label={recording ? 'Stop recording' : 'Start recording'}
              className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-chalk shadow-[inset_0_-3px_0_rgba(5,30,18,0.3)] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px active:shadow-none disabled:cursor-not-allowed ${
                recording ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-600'
                  : blocked ? 'bg-ink-300 shadow-none'
                  : requesting ? 'bg-board-500'
                  : 'bg-board-700 hover:bg-board-800 focus-visible:ring-board-600'
              }`}
            >
              {requesting ? <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
                : recording ? <Square className="h-6 w-6 fill-current" aria-hidden="true" />
                : blocked ? <MicOff className="h-7 w-7" aria-hidden="true" />
                : <Mic className="h-7 w-7" aria-hidden="true" />}
            </button>

            {recording ? (
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-bold text-rose-700">
                  <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
                  </span>
                  Recording
                </p>
                <p className="mt-1 text-[17px] font-semibold text-ink-500 tabular" aria-live="off">
                  <span className="numeral text-[2.75rem] leading-none text-ink-900">{fmt(elapsed)}</span>
                  {' '}/ {fmt(maxSeconds)}
                </p>
              </div>
            ) : requesting ? (
              <div className="min-w-0" role="status">
                <p className="text-[17px] font-bold leading-snug text-ink-900">Waiting for the microphone</p>
                <p className="mt-1 text-[15px] leading-snug text-ink-600">
                  Your browser is asking to use it. Choose <strong className="font-bold text-ink-900">Allow</strong>.
                </p>
              </div>
            ) : blocked ? (
              <div className="min-w-0">
                <p className="text-[17px] font-bold leading-snug text-ink-900">Recording is not available</p>
                <p className="mt-1 text-[15px] leading-snug text-ink-600">See how to fix it below.</p>
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-[17px] font-bold leading-snug text-ink-900">{problem ? 'Recording did not start' : 'Start recording'}</p>
                <p className="mt-1 text-[15px] leading-snug text-ink-600">
                  {problem ? 'See how to fix it below, then press the button to try again.' : (
                    <>Speak for up to <span className="font-semibold text-ink-900 tabular">{fmt(maxSeconds)}</span>. Press the button again to stop.</>
                  )}
                </p>
              </div>
            )}
          </div>

          {recording ? (
            <div className="mt-6">
              <LevelMeter history={history} />
              <div className="progress-track mt-3 h-1" aria-hidden="true">
                <div className="h-full rounded-full bg-ink-900" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
                <strong className={`font-bold ${heardSound ? 'text-board-700' : 'text-ink-900'}`}>{heardSound ? 'We can hear you.' : 'Start speaking.'}</strong>{' '}
                Press the red button to stop. Recording stops by itself at {fmt(maxSeconds)}.
              </p>
            </div>
          ) : null}

          {info ? (
            <div role="alert" className="mt-6 rounded-lg bg-rose-50 px-4 py-4 sm:px-5">
              <p className="text-[17px] font-bold leading-snug text-rose-700">{info.title}</p>
              {info.steps ? (
                <ol className="mt-3 space-y-1.5">
                  {info.steps.map((s, i) => (
                    <li key={s} className="flex items-baseline gap-3 text-[15px] leading-relaxed text-ink-800">
                      <span className="numeral w-4 shrink-0 text-lg leading-none text-ink-900" aria-hidden="true">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              <p className={`${info.steps ? 'mt-3' : 'mt-1.5'} text-[15px] leading-relaxed text-ink-800`}>{info.body}</p>
              {!blocked ? (
                <button type="button" className="btn-secondary btn-sm mt-4" onClick={startRecording}>Try again</button>
              ) : null}
            </div>
          ) : null}

          {!recording && !requesting && !blocked && !problem ? (
            <div className="mt-6 border-t border-ink-200 pt-4">
              {prepSeconds > 0 ? (
                <div className="flex flex-col gap-x-4 gap-y-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[15px] leading-relaxed text-ink-600">
                    Want exam conditions? Take <span className="font-semibold text-ink-900 tabular">{fmt(prepSeconds)}</span> to prepare first.
                  </p>
                  <button type="button" className="btn-secondary shrink-0" onClick={() => { setPrepLeft(prepSeconds); setPhase('prep') }}>
                    Start preparation timer
                  </button>
                </div>
              ) : (
                <p className="text-[15px] leading-relaxed text-ink-600">
                  The first time, your browser asks to use the microphone. Choose <strong className="font-bold text-ink-900">Allow</strong>.
                </p>
              )}
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-[15px] leading-relaxed text-ink-800">
              <strong className="font-bold text-rose-700">Something went wrong.</strong> {error}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
