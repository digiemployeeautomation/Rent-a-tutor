'use client'

// components/practice/Recorder.js
//
// MediaRecorder-based audio recorder for the Speaking section. Requests the
// mic, records, shows elapsed time, and allows stop + playback preview +
// re-record. On submit it: (1) creates a submission with an empty payload,
// (2) uploads the recorded blob to /api/submissions/:id/audio, (3) triggers
// grading, then routes to the result page.
//
// Props: { itemId }

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function Recorder({ itemId }) {
  const router = useRouter()

  // 'idle' | 'recording' | 'recorded' | 'submitting'
  const [phase, setPhase] = useState('idle')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const blobRef = useRef(null)
  const timerRef = useRef(null)

  // Clean up object URL + stream on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  async function startRecording() {
    setError(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    blobRef.current = null
    chunksRef.current = []

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Audio recording is not supported in this browser.')
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        setError('Microphone permission was denied. Please allow mic access and try again.')
      } else if (err && err.name === 'NotFoundError') {
        setError('No microphone was found. Connect a mic and try again.')
      } else {
        setError('Could not start recording. Please check your microphone settings.')
      }
      return
    }

    streamRef.current = stream
    let recorder
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    } catch {
      // Fall back to the browser default if audio/webm isn't supported.
      recorder = new MediaRecorder(stream)
    }
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      blobRef.current = blob
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      stopStream()
      setPhase('recorded')
    }

    recorder.start()
    setElapsed(0)
    setPhase('recording')
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }

  function resetRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    blobRef.current = null
    chunksRef.current = []
    setElapsed(0)
    setError(null)
    setPhase('idle')
  }

  async function handleSubmit() {
    if (!blobRef.current) {
      setError('Please record your answer before submitting.')
      return
    }
    setPhase('submitting')
    setError(null)
    try {
      // 1) create the submission (empty payload; audio_path is patched next).
      const subRes = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practice_item_id: itemId, payload: {} }),
      })
      if (!subRes.ok) {
        const body = await subRes.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to create submission')
      }
      const { submission } = await subRes.json()

      // 2) upload the recorded audio (raw body, audio/webm).
      const upRes = await fetch(`/api/submissions/${submission.id}/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/webm' },
        body: blobRef.current,
      })
      if (!upRes.ok) {
        const body = await upRes.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to upload audio')
      }

      // 3) trigger grading (STT + LLM).
      const gradeRes = await fetch(`/api/submissions/${submission.id}/grade`, {
        method: 'POST',
      })
      if (!gradeRes.ok) {
        const body = await gradeRes.json().catch(() => ({}))
        throw new Error(body.error || 'Grading failed')
      }

      router.push(`/practice/speaking/${itemId}/result/${submission.id}`)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setPhase('recorded')
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Recorder</div>
            <div className="mt-1 text-3xl font-bold tabular-nums text-gray-800">
              {formatElapsed(elapsed)}
            </div>
          </div>
          {phase === 'recording' && (
            <span className="flex items-center gap-2 text-sm font-medium text-red-600">
              <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-red-600" />
              Recording…
            </span>
          )}
        </div>

        {audioUrl && phase !== 'recording' && (
          <audio controls src={audioUrl} className="mt-4 w-full" />
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {phase === 'idle' && (
            <button
              type="button"
              onClick={startRecording}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 sm:w-auto"
            >
              Start recording
            </button>
          )}

          {phase === 'recording' && (
            <button
              type="button"
              onClick={stopRecording}
              className="w-full rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 sm:w-auto"
            >
              Stop
            </button>
          )}

          {(phase === 'recorded' || phase === 'submitting') && (
            <>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={phase === 'submitting'}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-opacity hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 sm:w-auto"
              >
                {phase === 'submitting' ? 'Uploading & grading…' : 'Submit for grading'}
              </button>
              <button
                type="button"
                onClick={resetRecording}
                disabled={phase === 'submitting'}
                className="w-full rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60 sm:w-auto"
              >
                Re-record
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
