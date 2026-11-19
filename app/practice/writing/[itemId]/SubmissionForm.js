'use client'
// app/practice/writing/[itemId]/SubmissionForm.js
//
// The Writing answer sheet: a large ruled textarea, live word count against
// the task minimum, optional count-up timer, draft autosave to localStorage
// (per item), and one action: "Get feedback". On submit it creates a
// submission, asks the server to grade it, then opens the result page.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Loader2, Pause, Play, RotateCcw } from 'lucide-react'

const draftKey = (itemId) => `rat:writing-draft:${itemId}`

// Faint ruled lines, one per line of text (line-height 1.7em), that scroll
// with the writing like a page in an exercise book. The first layer is a
// white strip that hides the stray rule above the first line.
const RULED = {
  lineHeight: 1.7,
  backgroundImage: 'linear-gradient(#FEFEFC, #FEFEFC), linear-gradient(to bottom, transparent calc(1.7em - 1px), #EAEEEB calc(1.7em - 1px))',
  backgroundSize: '100% 1em, 100% 1.7em',
  backgroundPosition: '0 0, 0 calc(1rem - 0.3em)',
  backgroundRepeat: 'no-repeat, repeat',
  backgroundAttachment: 'local, local',
}

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
  if (status === 401) return 'You have been signed out. Sign in again. Your essay is saved on this device.'
  if (status === 404) return 'This task is no longer available. Your essay is saved on this device.'
  if (status === 0) return 'No internet connection. Check your data or Wi-Fi and try again. Your essay is saved on this device.'
  if (step === 'grade') return 'We could not mark your essay just now. Your essay is saved. Please try again in a minute.'
  return 'We could not send your essay just now. Your essay is saved. Please try again in a minute.'
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
  const overTime = elapsed > suggestedMinutes * 60
  const timerUsed = running || elapsed > 0

  let countHint = `Aim for at least ${minimumWords} words.`
  if (words > 0 && !reached) countHint = `${minimumWords - words} more word${minimumWords - words === 1 ? '' : 's'} to reach the minimum.`
  if (reached) countHint = 'Minimum reached. Now check your spelling and grammar.'
  if (words > minimumWords * 1.8) countHint = 'This is long. In the exam, a longer answer takes time you need for checking.'

  const pendingLabel = phase === 'sending' ? 'Sending your essay…' : 'Reading your essay…'

  return (
    <section aria-labelledby="answer-heading" className="min-w-0">
      {/* Heading + optional timer */}
      <div className="rule-head items-center">
        <h2 id="answer-heading" className="h-section">Your answer</h2>
        <div className="flex items-center gap-1">
          {timerUsed ? (
            <p
              className="text-[15px] font-semibold tabular text-ink-500"
              aria-label={`Time spent ${fmt(elapsed)} of ${suggestedMinutes} minutes suggested`}
            >
              <span className={`numeral text-[1.375rem] leading-none ${overTime ? 'text-sun-700' : 'text-ink-900'}`}>{fmt(elapsed)}</span>
              {' '}/ {suggestedMinutes}:00
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            disabled={busy}
            className="btn-ghost btn-sm -mr-2"
            aria-pressed={running}
          >
            {running
              ? <><Pause className="h-4 w-4" aria-hidden="true" /> Pause</>
              : <><Play className="h-4 w-4" aria-hidden="true" /> {elapsed ? 'Resume' : `Start ${suggestedMinutes} min timer`}</>}
          </button>
        </div>
      </div>
      {overTime ? (
        <p className="rounded-b-lg bg-sun-100 px-4 py-2.5 text-[15px] leading-relaxed text-ink-800">
          You have passed the suggested {suggestedMinutes} minutes. Finish your last point and check your work.
        </p>
      ) : null}

      <textarea
        id="essay"
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={busy}
        rows={12}
        spellCheck={false}
        autoCapitalize="sentences"
        placeholder={loaded ? 'Start writing here. Your work is saved on this device as you type.' : ''}
        aria-labelledby="answer-heading"
        aria-describedby="word-status"
        style={RULED}
        className={`field mt-4 min-h-[320px] resize-y px-4 py-4 text-[17px] sm:px-5 lg:min-h-[440px] ${busy ? '!text-ink-600' : ''}`}
      />

      {/* Status line: words against the minimum, suggested time, draft */}
      <div id="word-status" className="mt-3 flex flex-col gap-x-6 gap-y-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={`text-[15px] font-semibold tabular ${reached ? 'text-board-700' : 'text-ink-600'}`} aria-live="polite">
            <span className={`numeral text-[1.75rem] leading-none ${reached ? 'text-board-700' : words ? 'text-ink-900' : 'text-ink-400'}`}>{words}</span>
            {' '}/ {minimumWords} words
            {reached ? <Check className="mb-1 ml-1.5 inline h-4 w-4" strokeWidth={3} aria-hidden="true" /> : null}
          </p>
          <p className="mt-1 text-[15px] text-ink-600">{countHint}</p>
        </div>
        <div className="shrink-0 text-[13px] font-semibold text-ink-500 sm:pt-2 sm:text-right">
          <p>Suggested time: about {suggestedMinutes} minutes</p>
          <p className="mt-1">
            {saveState === 'unavailable' ? 'Your draft cannot be saved in this browser'
              : saveState === 'restored' ? 'Your saved draft was restored'
              : saveState === 'saved' ? 'Draft saved on this device'
              : null}
          </p>
          {text.trim() && !busy ? (
            <button type="button" onClick={startOver} className="-mx-1 mt-0.5 inline-flex min-h-[36px] items-center gap-1.5 rounded px-1 font-bold text-ink-700 underline decoration-ink-300 underline-offset-4 hover:text-ink-900 hover:decoration-ink-900">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Start over
            </button>
          ) : null}
        </div>
      </div>

      {veryShort && !busy ? (
        <p className="mt-4 rounded-lg bg-sun-100 px-4 py-3 text-[15px] leading-relaxed text-ink-800">
          <strong className="font-bold text-ink-900">Very short.</strong>{' '}
          In the exam, answers under {minimumWords} words lose marks. You can still get feedback now.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-[15px] leading-relaxed text-ink-800">
          <strong className="font-bold text-rose-700">Not sent.</strong> {error}
        </p>
      ) : null}

      {/* The one action */}
      <div className="mt-6 flex flex-col gap-x-5 gap-y-3 border-t border-ink-200 pt-6 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || busy}
          className="btn-primary btn-lg group shrink-0"
        >
          {busy ? (
            <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> {pendingLabel}</>
          ) : (
            <>{error ? 'Try again' : 'Get feedback'} <ArrowRight className="nudge h-5 w-5" aria-hidden="true" /></>
          )}
        </button>
        {busy ? (
          <p role="status" className="text-[15px] leading-snug text-ink-600">This usually takes a few seconds. Please keep this page open.</p>
        ) : !text.trim() ? (
          <p className="text-[15px] leading-snug text-ink-600">Write your answer first. The button works as soon as you start typing.</p>
        ) : (
          <p className="text-[15px] leading-snug text-ink-600">You get a band for each of the four marking criteria, with comments.</p>
        )}
      </div>
    </section>
  )
}
