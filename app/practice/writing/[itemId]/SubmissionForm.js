'use client'
// app/practice/writing/[itemId]/SubmissionForm.js
//
// The Writing editor: large textarea, live word count against the task
// minimum, optional count-up timer, draft autosave to localStorage (per item),
// and a fixed action bar with "Get feedback". On submit it creates a
// submission, asks the server to grade it, then opens the result page.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2, Pause, Play, RotateCcw, Send, Timer } from 'lucide-react'

const draftKey = (itemId) => `rat:writing-draft:${itemId}`

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function fmt(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function readDraft(itemId) {
  try {
    const raw = window.localStorage.getItem(draftKey(itemId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed?.text === 'string' ? parsed : null
  } catch {
    return null
  }
}

function writeDraft(itemId, text) {
  try {
    if (text.trim()) window.localStorage.setItem(draftKey(itemId), JSON.stringify({ text, savedAt: Date.now() }))
    else window.localStorage.removeItem(draftKey(itemId))
    return true
  } catch {
    return false
  }
}

function clearDraft(itemId) {
  try { window.localStorage.removeItem(draftKey(itemId)) } catch {}
}

// Turn API / network failures into plain words. The draft is always kept.
function friendlyError(status, step) {
  if (status === 401) return 'You have been signed out. Sign in again — your essay is saved on this device.'
  if (status === 404) return 'This task is no longer available. Your essay is saved on this device.'
  if (status === 0) return 'No internet connection. Check your data or Wi-Fi and try again — your essay is saved on this device.'
  if (step === 'grade') return 'We could not mark your essay just now. Your essay is saved — please try again in a minute.'
  return 'We could not send your essay just now. Your essay is saved — please try again in a minute.'
}

export default function SubmissionForm({ itemId, minimumWords = 250, suggestedMinutes = 40 }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState('idle') // idle | saved | restored | unavailable
  const [phase, setPhase] = useState('editing') // editing | sending | grading | done
  const [error, setError] = useState(null)

  // Timer (optional, count-up)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // A submission that was created but failed to grade, so "try again" re-grades
  // it instead of creating a duplicate (only while the text is unchanged).
  const pendingRef = useRef(null)
  const textareaRef = useRef(null)
  const lastSavedRef = useRef('')

  const words = useMemo(() => countWords(text), [text])
  const busy = phase === 'sending' || phase === 'grading' || phase === 'done'

  // Restore draft once, after mount (localStorage is browser-only).
  useEffect(() => {
    const d = readDraft(itemId)
    if (d?.text) {
      lastSavedRef.current = d.text
      setText(d.text)
      setSaveState('restored')
    }
    setLoaded(true)
  }, [itemId])

  // Autosave, debounced.
  useEffect(() => {
    if (!loaded || busy) return
    const t = setTimeout(() => {
      if (text === lastSavedRef.current) return
      const ok = writeDraft(itemId, text)
      lastSavedRef.current = text
      if (!ok) setSaveState('unavailable')
      else setSaveState(text.trim() ? 'saved' : 'idle')
    }, 600)
    return () => clearTimeout(t)
  }, [text, itemId, loaded, busy])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const submit = useCallback(async () => {
    if (!text.trim() || busy) return
    setError(null)
    writeDraft(itemId, text)
    setRunning(false)

    let submissionId = pendingRef.current?.text === text ? pendingRef.current.id : null
    let step = 'send'
    try {
      if (!submissionId) {
        setPhase('sending')
        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ practice_item_id: itemId, payload: { response_text: text } }),
        })
        if (!res.ok) throw Object.assign(new Error('send'), { status: res.status })
        const { submission } = await res.json()
        submissionId = submission.id
        pendingRef.current = { id: submissionId, text }
      }

      step = 'grade'
      setPhase('grading')
      const gradeRes = await fetch(`/api/submissions/${submissionId}/grade`, { method: 'POST' })
      if (!gradeRes.ok) throw Object.assign(new Error('grade'), { status: gradeRes.status })

      pendingRef.current = null
      clearDraft(itemId)
      setPhase('done')
      router.push(`/practice/writing/${itemId}/result/${submissionId}`)
    } catch (err) {
      const status = err?.status ?? 0
      setError(friendlyError(status, step))
      setPhase('editing')
    }
  }, [text, busy, itemId, router])

  function startOver() {
    if (!text.trim()) return
    if (!window.confirm('Delete your essay and start again? This cannot be undone.')) return
    setText('')
    clearDraft(itemId)
    lastSavedRef.current = ''
    setSaveState('idle')
    setElapsed(0)
    setRunning(false)
    pendingRef.current = null
    textareaRef.current?.focus()
  }

  // Word-count status
  const reached = words >= minimumWords
  const veryShort = words > 0 && words < Math.ceil(minimumWords * 0.5)
  const pct = Math.min(100, Math.round((words / minimumWords) * 100))
  const countTone = words === 0 ? 'text-ink-400' : reached ? 'text-emerald-700' : 'text-sun-600'
  const barTone = reached ? 'bg-emerald-500' : 'bg-sun-400'
  const overTime = elapsed > suggestedMinutes * 60

  let countHint = `Aim for at least ${minimumWords} words.`
  if (words > 0 && !reached) countHint = `${minimumWords - words} more word${minimumWords - words === 1 ? '' : 's'} to reach the minimum.`
  if (reached) countHint = 'Minimum reached. Now check your spelling and grammar.'
  if (words > minimumWords * 1.8) countHint = 'This is long. In the exam, a longer answer takes time you need for checking.'

  const pendingLabel = phase === 'sending' ? 'Sending your essay…' : 'Reading your essay…'

  return (
    <section aria-labelledby="answer-heading" className="min-w-0">
      <div className="card">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3 sm:px-5">
          <h2 id="answer-heading" className="font-display text-base font-semibold text-ink-900">Your answer</h2>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold tabular-nums ${overTime ? 'bg-sun-100 text-sun-600' : 'text-ink-600'}`}
              aria-label={`Time spent ${fmt(elapsed)} of ${suggestedMinutes} minutes suggested`}
            >
              <Timer className="h-4 w-4" aria-hidden="true" />
              {fmt(elapsed)}<span className="font-normal text-ink-400">/ {suggestedMinutes}:00</span>
            </span>
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              disabled={busy}
              className="btn-ghost btn-sm"
              aria-pressed={running}
            >
              {running ? <><Pause className="h-4 w-4" aria-hidden="true" /> Pause</> : <><Play className="h-4 w-4" aria-hidden="true" /> {elapsed ? 'Resume' : 'Start timer'}</>}
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <textarea
            id="essay"
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            readOnly={busy}
            rows={16}
            spellCheck={false}
            autoCapitalize="sentences"
            placeholder={loaded ? 'Start writing here. Your work is saved on this device as you type.' : ''}
            aria-labelledby="answer-heading"
            aria-describedby="word-status"
            className="field min-h-[50vh] resize-y border-transparent px-2 text-[16px] leading-[1.75] focus:border-blue-500 sm:px-3 lg:min-h-[480px]"
          />
        </div>

        {/* Word count + draft status */}
        <div className="border-t border-ink-100 px-4 py-3 sm:px-5" id="word-status">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-sm font-semibold tabular-nums ${countTone}`} aria-live="polite">
              {words} / {minimumWords} words
            </p>
            <p className="flex items-center gap-1.5 text-xs text-ink-400">
              {saveState === 'unavailable' ? (
                <>Draft can’t be saved in this browser</>
              ) : saveState === 'restored' ? (
                <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Your saved draft was restored</>
              ) : saveState === 'saved' ? (
                <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Saved on this device</>
              ) : null}
            </p>
          </div>
          <div className="progress-track mt-2 h-1.5" aria-hidden="true">
            <div className={`h-full rounded-full transition-[width] duration-300 ${words ? barTone : ''}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex items-start justify-between gap-3">
            <p className="text-sm text-ink-500">{countHint}</p>
            {text.trim() && !busy ? (
              <button type="button" onClick={startOver} className="btn-ghost btn-sm shrink-0 text-ink-400">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Start over
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {veryShort && !busy ? (
        <p className="mt-3 rounded-xl bg-sun-50 px-4 py-3 text-sm text-ink-700">
          Your answer is very short. In the exam, answers under {minimumWords} words lose marks — you can still get feedback now.
        </p>
      ) : null}

      {error ? (
        <div role="alert" className="mt-3 flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      {busy ? (
        <div role="status" className="mt-3 flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800 animate-fade-in">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          <p><span className="font-semibold">{pendingLabel}</span> This usually takes a few seconds. Please keep this page open.</p>
        </div>
      ) : null}

      {/* Fixed action bar */}
      <div className="no-print fixed inset-x-0 bottom-16 z-30 border-t border-ink-100 bg-white/95 backdrop-blur-md md:bottom-0">
        <div className="container-app flex items-center justify-between gap-3 py-3">
          <p className={`text-sm font-semibold tabular-nums ${countTone}`}>
            {words} word{words === 1 ? '' : 's'}
            <span className="hidden font-normal text-ink-400 sm:inline"> · minimum {minimumWords}</span>
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim() || busy}
            className="btn-primary btn-lg"
          >
            {busy ? (
              <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> {pendingLabel}</>
            ) : (
              <><Send className="h-5 w-5" aria-hidden="true" /> Get feedback</>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
