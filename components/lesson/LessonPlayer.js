'use client'
// components/lesson/LessonPlayer.js
//
// The high-school lesson experience: one idea per screen.
//   intro -> sections (explain / example / check / mistake / summary) -> quiz -> result
// Takes a lesson object in the content/highschool JSON format, so it works the
// same online and from the offline Downloads library (IELTS reading lessons
// arrive in the same shape with `quiz: []` and no objectives).
//
// Props:
//   lesson       the lesson JSON (required)
//   meta         subject display meta from lib/highschool/subjects.js (optional)
//   backHref     where the close (X) button goes
//   next         { href, title } of the next lesson (optional)
//   actions      extra node shown on the intro + result screens (e.g. download buttons)
//   onComplete   (score, total) => void, called when the quiz is finished
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, Clock, ListOrdered, RotateCcw, X } from 'lucide-react'
import SubjectArt from '@/components/art/SubjectArt'
import Segments from '@/components/kit/Segments'
import Stamp from '@/components/kit/Stamp'
import { isPassed, PASS_MARK } from '@/lib/highschool/subjects'
import { saveProgress } from '@/lib/highschool/progress-client'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

// The lesson title on the title page: display face, 36px on a phone up to 54px.
const TITLE = { fontSize: 'clamp(2.25rem, 1.6rem + 2.9vw, 3.375rem)', lineHeight: 1.04, letterSpacing: '-0.03em' }

// Body copy on a reading screen: 17px, line-height 1.6, about 62 characters wide.
const BODY = 'max-w-[62ch] text-[17px] leading-[1.6]'

// The mobile tab bar (components/layout/BottomTabs) is only rendered for
// signed-in students, so the fixed action bar sits above it only when it is
// really on the page. Watching the DOM keeps this free of any auth calls.
function useTabBar() {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const check = () => setShown(!!document.querySelector('nav.fixed.bottom-0[aria-label="Main"]'))
    check()
    const host = document.querySelector('main')?.parentElement || document.body
    const observer = new MutationObserver(check)
    observer.observe(host, { childList: true })
    return () => observer.disconnect()
  }, [])
  return shown
}

function Prose({ text, className = '', tone = 'text-ink-700' }) {
  if (!text) return null
  return (
    <div className={`space-y-4 ${className}`}>
      {String(text).split(/\n\n+/).map((p, i) => (
        <p key={i} className={`whitespace-pre-line ${BODY} ${tone}`}>{p}</p>
      ))}
    </div>
  )
}

// Lesson diagrams are inline SVG strings from the lesson file. The wrapper
// makes them fill the figure and swaps their text into the app font.
function Figure({ svg }) {
  if (!svg) return null
  return (
    <figure
      className="-mx-5 mt-7 overflow-hidden border-y border-ink-200 bg-white px-2 py-3 sm:mx-0 sm:rounded-xl sm:border sm:px-8 sm:py-7 [&>svg]:mx-auto [&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-[560px] [&_text]:font-sans"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

// Small bold line that names the kind of step. One per view.
function Kind({ children, tone }) {
  return <p className={`eyebrow ${tone === 'copper' ? '!text-copper-700' : ''}`}>{children}</p>
}

function StepTitle({ children, className = '' }) {
  return <h1 className={`h-page text-balance first-letter:uppercase ${className}`}>{children}</h1>
}

// Exam-paper answer rows, shared by the quick questions and the quiz.
function Options({ options, answer, picked, onPick, locked }) {
  return (
    <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label="Answers">
      {options.map((opt, i) => {
        const isPicked = picked === i
        const isRight = i === answer
        let row = 'border-ink-300 bg-white text-ink-900 hover:border-ink-900'
        let letter = ''
        let mark = null
        if (locked && isRight) {
          row = 'border-board-600 bg-board-50 text-ink-900 shadow-[inset_0_0_0_1px_#1A6B48]'
          letter = '!border-board-700 !bg-board-700 !text-chalk'
          mark = <Check className="h-5 w-5 shrink-0 text-board-700" strokeWidth={3} aria-hidden="true" />
        } else if (locked && isPicked) {
          row = 'border-rose-600 bg-rose-50 text-ink-900 shadow-[inset_0_0_0_1px_#CC2E2C]'
          letter = '!border-rose-600 !bg-rose-600 !text-white'
          mark = <X className="h-5 w-5 shrink-0 text-rose-600" strokeWidth={3} aria-hidden="true" />
        } else if (locked) {
          row = 'border-ink-200 bg-white text-ink-500'
          letter = '!border-ink-200 !text-ink-500'
        } else if (isPicked) {
          row = 'border-board-700 bg-board-50 text-ink-900 shadow-[inset_0_0_0_1px_#0F5337]'
          letter = '!border-board-700 !bg-board-700 !text-chalk'
        }
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={isPicked}
            disabled={locked}
            onClick={() => onPick(i)}
            className={`flex min-h-[52px] w-full items-center gap-3.5 rounded-lg border px-3.5 py-3 text-left text-[16px] leading-snug disabled:cursor-default sm:text-[17px] ${row}`}
          >
            <span className={`opt-letter ${letter}`} aria-hidden="true">{LETTERS[i] ?? i + 1}</span>
            <span className="min-w-0 flex-1 whitespace-pre-line">{opt}</span>
            {mark}
            {locked && isRight ? <span className="sr-only">(correct answer)</span> : null}
            {locked && isPicked && !isRight ? <span className="sr-only">(your answer, not correct)</span> : null}
          </button>
        )
      })}
    </div>
  )
}

function Feedback({ correct, explanation }) {
  return (
    <p role="status" className={`mt-6 animate-fade-in whitespace-pre-line text-ink-700 ${BODY}`}>
      <strong className={`font-bold ${correct ? 'text-board-700' : 'text-rose-700'}`}>{correct ? 'Correct.' : 'Not quite.'}</strong>{' '}
      {explanation}
    </p>
  )
}

function Question({ children }) {
  return (
    <h1 className="mt-2 whitespace-pre-line font-sans text-[19px] font-bold leading-[1.35] tracking-normal text-ink-900">
      {children}
    </h1>
  )
}

function ExampleSection({ section, tone }) {
  const [shown, setShown] = useState(1)
  const total = section.steps.length
  const done = shown > total
  return (
    <div>
      <Kind tone={tone}>Worked example</Kind>
      <StepTitle className="mt-2">{section.title.replace(/^Worked example:\s*/i, '')}</StepTitle>
      <div className="-mx-5 mt-6 bg-board-50 px-5 py-5 sm:mx-0 sm:rounded-xl sm:px-6">
        <p className="text-[13px] font-bold text-board-800">The question</p>
        <p className={`mt-1 whitespace-pre-line text-ink-900 ${BODY}`}>{section.problem}</p>
      </div>
      <ol className={`divide-y divide-ink-200 ${done ? '' : 'border-b border-ink-200'}`}>
        {section.steps.slice(0, Math.min(shown, total)).map((step, i) => (
          <li key={i} className="flex animate-fade-in-up gap-4 py-4">
            <span className="numeral w-6 shrink-0 text-[1.625rem] leading-7 text-copper-600" aria-hidden="true">{i + 1}</span>
            <p className={`whitespace-pre-line text-ink-800 ${BODY}`}>{step.replace(/^Step\s*\d+\s*[:.)-]\s*/i, '')}</p>
          </li>
        ))}
      </ol>
      {done ? (
        <div className="animate-fade-in-up border-t-2 border-ink-900 pt-3.5">
          <p className="text-[13px] font-bold text-ink-500">Answer</p>
          <p className="mt-1 max-w-[62ch] whitespace-pre-line text-[19px] font-bold leading-[1.4] text-ink-900">{section.answer}</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => setShown((n) => n + 1)}>
            {shown >= total ? 'Show the answer' : `Show step ${shown + 1} of ${total}`}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setShown(total + 1)}>Show all</button>
        </div>
      )}
    </div>
  )
}

function CheckSection({ section, value, onAnswer, tone }) {
  const locked = value != null
  return (
    <div>
      <Kind tone={tone}>Quick question</Kind>
      <Question>{section.question}</Question>
      <Options options={section.options} answer={section.answer} picked={value} locked={locked} onPick={onAnswer} />
      {locked ? <Feedback correct={value === section.answer} explanation={section.explanation} /> : (
        <p className="mt-4 text-sm text-ink-500">Choose an answer to continue. This one is for practice and is not scored.</p>
      )}
    </div>
  )
}

function Section({ section, checkValue, onCheck, tone }) {
  switch (section.type) {
    case 'example':
      return <ExampleSection section={section} tone={tone} />
    case 'check':
      return <CheckSection section={section} value={checkValue} onAnswer={onCheck} tone={tone} />
    case 'mistake':
      return (
        <div className="-mx-5 bg-sun-100 px-5 py-7 sm:mx-0 sm:rounded-xl sm:px-8 sm:py-8">
          <p className="text-[13px] font-bold leading-5 text-sun-800">Common mistake</p>
          <StepTitle className="mt-2">{section.title.replace(/^Common mistake:\s*/i, '')}</StepTitle>
          <Prose text={section.body} className="mt-4" tone="text-ink-800" />
        </div>
      )
    case 'summary':
      return (
        <div>
          <Kind tone={tone}>Summary</Kind>
          <StepTitle className="mt-2">{section.title || 'Key points'}</StepTitle>
          <ul className="rows mt-6 border-t-2 border-t-ink-900">
            {section.bullets.map((b, i) => (
              <li key={i} className="flex gap-3.5 py-3.5">
                <Check className="mt-[5px] h-[18px] w-[18px] shrink-0 text-board-700" strokeWidth={3} aria-hidden="true" />
                <span className={`text-ink-800 ${BODY}`}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    default:
      return (
        <div>
          <StepTitle>{section.title}</StepTitle>
          <Prose text={section.body} className="mt-5" />
          {section.bullets?.length ? (
            <ul className="mt-5 space-y-2.5">
              {section.bullets.map((b, i) => (
                <li key={i} className={`flex gap-3.5 text-ink-800 ${BODY}`}>
                  <span className="mt-[0.72em] h-1.5 w-1.5 shrink-0 bg-board-600" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <Figure svg={section.svg} />
        </div>
      )
  }
}

function Glossary({ items, onClose }) {
  const panelRef = useRef(null)
  useEffect(() => {
    panelRef.current?.focus()
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-title"
        className="flex max-h-[82vh] w-full max-w-xl animate-fade-in-up flex-col rounded-t-2xl bg-white px-5 pt-3 shadow-lg outline-none sm:rounded-xl sm:px-8 sm:pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rule-head items-center !pb-1.5">
          <h2 id="glossary-title" className="h-section">Key words</h2>
          <button type="button" onClick={onClose} aria-label="Close key words" className="-mr-2.5 flex h-11 w-11 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <dl className="divide-y divide-ink-200 overflow-y-auto pb-5 sm:pb-6">
          {items.map((g) => (
            <div key={g.term} className="py-3.5 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="text-[16px] font-bold leading-snug text-ink-900">{g.term}</dt>
              <dd className="mt-0.5 text-[16px] leading-[1.5] text-ink-700 sm:mt-0">{g.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

export default function LessonPlayer({ lesson, meta, backHref = '/learn/high-school', next, actions, onComplete }) {
  const sections = lesson.sections
  const quiz = lesson.quiz || []
  const hasQuiz = quiz.length > 0
  // step: 0 = intro, 1..n = sections, n+1 = quiz, n+2 = result
  const QUIZ = sections.length + 1
  const RESULT = sections.length + 2

  const [step, setStep] = useState(0)
  const [checks, setChecks] = useState({})
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [picked, setPicked] = useState(null)
  const [locked, setLocked] = useState(false)
  const [showGlossary, setShowGlossary] = useState(false)
  const tabBar = useTabBar()

  const posKey = `rat.hs.pos.${lesson.id}`

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(posKey))
      if (saved > 0 && saved <= sections.length) setStep(saved)
    } catch {}
  }, [posKey, sections.length])

  useEffect(() => {
    try { localStorage.setItem(posKey, String(step >= QUIZ ? 0 : step)) } catch {}
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [step, posKey, QUIZ])

  const section = step >= 1 && step <= sections.length ? sections[step - 1] : null
  const blocked = section?.type === 'check' && checks[step] == null
  const score = useMemo(() => answers.filter((a, i) => a === quiz[i].answer).length, [answers, quiz])
  const passed = isPassed(score, quiz.length)
  const passNeeded = Math.ceil(quiz.length * PASS_MARK - 1e-9)

  const goNext = useCallback(() => {
    if (blocked) return
    setStep((s) => (!hasQuiz && s === QUIZ - 1 ? RESULT : Math.min(s + 1, RESULT)))
  }, [blocked, RESULT, QUIZ, hasQuiz])
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), [])
  const closeGlossary = useCallback(() => setShowGlossary(false), [])

  useEffect(() => {
    function onKey(e) {
      if (showGlossary || step < 1 || step > sections.length) return
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, sections.length, goNext, goBack, showGlossary])

  function submitAnswer() {
    if (picked == null) return
    setLocked(true)
  }

  function nextQuestion() {
    const all = [...answers, picked]
    setAnswers(all)
    setPicked(null)
    setLocked(false)
    if (qIndex + 1 < quiz.length) {
      setQIndex(qIndex + 1)
    } else {
      const finalScore = all.filter((a, i) => a === quiz[i].answer).length
      saveProgress(lesson.id, finalScore, quiz.length)
      onComplete?.(finalScore, quiz.length)
      setStep(RESULT)
    }
  }

  function retryQuiz() {
    setAnswers([]); setQIndex(0); setPicked(null); setLocked(false); setStep(QUIZ)
  }

  function restart() {
    setChecks({}); setAnswers([]); setQIndex(0); setPicked(null); setLocked(false); setStep(0)
  }

  const q = quiz[qIndex] || null
  // Running tally for the quiz bar: answers already handed in, plus the one being shown.
  const answered = answers.length + (locked ? 1 : 0)
  const rightSoFar = score + (locked && q && picked === q.answer ? 1 : 0)
  const isIelts = lesson.course === 'ielts'
  const tone = isIelts ? 'copper' : 'board'
  // "Biology" from the subject meta, or "IELTS Reading" worked out from the slug
  const subjectName = meta?.name || String(lesson.subject || '').split('-').filter(Boolean)
    .map((w) => (w === 'ielts' ? 'IELTS' : w[0].toUpperCase() + w.slice(1))).join(' ')
  const artName = String(lesson.subject || '').replace(/^ielts-/, '') || 'quiz'
  const backLabel = backHref === '/downloads' ? 'Back to Downloads' : meta?.name ? `Back to ${meta.name}` : 'Back to course'

  // Plain-text line above the title: "Biology · Form 4 · Term 1 · The Nervous System"
  const place = [
    lesson.form ? `Form ${lesson.form}` : '',
    lesson.form && lesson.term ? `Term ${lesson.term}` : '',
    lesson.topic && lesson.topic !== subjectName ? lesson.topic : '',
  ].filter(Boolean)

  // The running head: where you are, in words and in segments.
  let where = { label: `${sections.length} steps`, rest: hasQuiz ? 'then a quiz' : '', total: sections.length, done: 0 }
  if (section) where = { label: `Step ${step}`, rest: `of ${sections.length}`, total: sections.length, done: step }
  else if (step === QUIZ && hasQuiz) where = { label: `Question ${qIndex + 1}`, rest: `of ${quiz.length}`, total: quiz.length, done: qIndex + (locked ? 1 : 0) }
  else if (step === RESULT) where = { label: hasQuiz ? 'Quiz finished' : 'Lesson finished', rest: '', total: hasQuiz ? quiz.length : sections.length, done: hasQuiz ? quiz.length : sections.length }

  const barBottom = tabBar ? 'bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0' : 'bottom-0'

  return (
    <div className="bg-paper">
      {/* ── Running head: leave, where you are, key words ────────── */}
      <div className="no-print sticky top-[61px] z-30 border-b border-ink-200 bg-paper">
        <div className="container-read flex h-14 items-center gap-2 sm:gap-3">
          <Link href={backHref} aria-label="Leave lesson" title="Leave lesson" className="-ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900">
            <X className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
            <p className="whitespace-nowrap text-[13px] font-bold leading-4 text-ink-900 tabular" aria-live="polite">
              {where.label}{where.rest ? <span className="font-semibold text-ink-500"> {where.rest}</span> : null}
            </p>
            <Segments
              total={where.total}
              done={where.done}
              tone={tone}
              label="Lesson progress"
              className="mt-1.5 sm:mt-0 sm:flex-1"
            />
          </div>
          {lesson.glossary?.length ? (
            <button type="button" onClick={() => setShowGlossary(true)} className="btn-ghost -mr-3 shrink-0 !px-3 text-[13px] sm:ml-2">
              Key words
            </button>
          ) : null}
        </div>
      </div>

      <div className="container-read pb-32 pt-8 sm:pt-12">
        {/* ── Intro: the title page ─────────────────────────────── */}
        {step === 0 ? (
          <div className="stagger">
            <header className="flex animate-fade-in-up items-start justify-between gap-8">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-5 text-ink-500 sm:text-sm">
                  {subjectName ? <span className={`font-bold ${isIelts ? 'text-copper-700' : 'text-board-700'}`}>{subjectName}</span> : null}
                  {place.map((p, i) => <span key={p}>{subjectName || i > 0 ? ' · ' : ''}{p}</span>)}
                </p>
                <h1
                  className="mt-3 text-balance font-display font-semibold text-ink-900"
                  style={TITLE}
                >
                  {lesson.title}
                </h1>
                {lesson.summary ? <p className="lead mt-4">{lesson.summary}</p> : null}
              </div>
              <SubjectArt name={artName} tone={tone} className="mt-1 hidden h-24 w-24 sm:block" />
            </header>

            <p className="mt-5 animate-fade-in-up text-[15px] font-semibold text-ink-700 sm:hidden">
              {[lesson.minutes ? `About ${lesson.minutes} min` : '', `${sections.length} steps`, hasQuiz ? `${quiz.length}-question quiz` : ''].filter(Boolean).join(' · ')}
            </p>
            <ul className="mt-6 hidden animate-fade-in-up flex-wrap gap-x-5 gap-y-1.5 text-[15px] font-semibold text-ink-700 sm:flex">
              {lesson.minutes ? (
                <li className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-ink-400" aria-hidden="true" /> About {lesson.minutes} minutes</li>
              ) : null}
              <li className="inline-flex items-center gap-1.5"><ListOrdered className="h-4 w-4 text-ink-400" aria-hidden="true" /> {sections.length} short steps</li>
              {hasQuiz ? (
                <li className="inline-flex items-center gap-1.5"><ClipboardCheck className="h-4 w-4 text-ink-400" aria-hidden="true" /> {quiz.length}-question quiz</li>
              ) : null}
            </ul>

            <div className="no-print mt-8 hidden animate-fade-in-up items-center gap-5 md:flex">
              <button type="button" className="btn-primary btn-lg group" onClick={goNext}>
                Start lesson <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
              </button>
              <p className="text-sm text-ink-500">Take your time. You can stop and come back.</p>
            </div>

            {lesson.objectives?.length ? (
              <section className="mt-10 animate-fade-in-up sm:mt-12" aria-labelledby="aims-heading">
                <div className="rule-head">
                  <h2 id="aims-heading" className="h-sub">By the end you will be able to</h2>
                </div>
                <ol className="rows">
                  {(lesson.objectives || []).map((o, i) => (
                    <li key={i} className="flex items-baseline gap-4 py-3">
                      <span className="numeral w-5 shrink-0 text-[1.375rem] leading-7 text-copper-600" aria-hidden="true">{i + 1}</span>
                      <span className={`text-ink-800 ${BODY}`}>{o}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {/* Sits on the last rule of the list above, as one more ruled row. */}
            {actions ? <div className={`animate-fade-in-up ${lesson.objectives?.length ? '-mt-px' : 'mt-10'}`}>{actions}</div> : null}
          </div>
        ) : null}

        {/* ── Teaching sections ─────────────────────────────────── */}
        {section ? (
          <article key={step} className="animate-fade-in">
            <Section section={section} tone={tone} checkValue={checks[step]} onCheck={(i) => setChecks((c) => ({ ...c, [step]: i }))} />
          </article>
        ) : null}

        {/* ── Quiz ──────────────────────────────────────────────── */}
        {step === QUIZ && hasQuiz ? (
          <article key={`q${qIndex}`} className="animate-fade-in">
            <Kind tone={tone}>Lesson quiz</Kind>
            <Question>{q.question}</Question>
            <Options options={q.options} answer={q.answer} picked={picked} locked={locked} onPick={setPicked} />
            {locked ? <Feedback correct={picked === q.answer} explanation={q.explanation} /> : (
              <p className="mt-4 text-sm text-ink-500">Choose the best answer, then check it. You need {passNeeded} of {quiz.length} to pass.</p>
            )}
          </article>
        ) : null}

        {/* ── Result ────────────────────────────────────────────── */}
        {step === RESULT && !hasQuiz ? (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between gap-6">
              <div className="min-w-0">
                <Kind tone={tone}>{lesson.title}</Kind>
                <h1 className="mt-2 font-display font-semibold text-ink-900" style={TITLE}>Lesson complete</h1>
              </div>
              <Stamp word="Done" className="h-24 w-24 sm:h-32 sm:w-32" />
            </div>
            <p className="lead mt-5">You have reached the end of this lesson. Go back over any step whenever you need to.</p>
            {next ? <p className="mt-5 text-[15px] text-ink-600">Up next: <span className="font-bold text-ink-900">{next.title}</span></p> : null}
            <div className={`${next ? 'mt-3' : 'mt-7'} flex flex-wrap gap-2.5`}>
              {next ? <Link href={next.href} className="btn-primary btn-lg group w-full sm:w-auto">Next lesson <ArrowRight className="nudge h-5 w-5" aria-hidden="true" /></Link> : null}
              <Link href={backHref} className={`${next ? 'btn-secondary' : 'btn-primary'} btn-lg w-full sm:w-auto`}>{backLabel}</Link>
              <button type="button" className="btn-ghost btn-lg w-full sm:w-auto" onClick={restart}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Start again</button>
            </div>
            {actions ? <div className="mt-10">{actions}</div> : null}
          </div>
        ) : null}

        {step === RESULT && hasQuiz ? (
          <div className="animate-fade-in">
            <Kind tone={tone}>{lesson.title}</Kind>
            <div className="mt-3 flex items-center gap-6 sm:gap-10">
              <p className="numeral text-[6.5rem] leading-[0.9] text-ink-900 sm:text-[9rem]" aria-label={`${score} out of ${quiz.length}`}>
                {score}<span className="text-ink-400">/{quiz.length}</span>
              </p>
              {passed
                ? <Stamp word="Passed" className="h-28 w-28 sm:h-36 sm:w-36" />
                : <Stamp word="Try again" tone="copper" className="h-28 w-28 sm:h-36 sm:w-36" />}
            </div>
            <h1 className="h-page mt-6">
              {score === quiz.length ? 'Perfect score' : passed ? 'Lesson complete' : 'Not passed yet'}
            </h1>
            <p className="lead mt-2">
              {passed
                ? `You got ${score} out of ${quiz.length}. This lesson is now ticked off on your course page.`
                : `You got ${score} out of ${quiz.length}, and the pass mark is ${passNeeded}. Read the explanations below, then try the quiz again.`}
            </p>
            {passed && next ? <p className="mt-5 text-[15px] text-ink-600">Up next: <span className="font-bold text-ink-900">{next.title}</span></p> : null}
            <div className={`${passed && next ? 'mt-3' : 'mt-7'} flex flex-wrap gap-2.5`}>
              {passed && next ? (
                <Link href={next.href} className="btn-primary btn-lg group w-full sm:w-auto">Next lesson <ArrowRight className="nudge h-5 w-5" aria-hidden="true" /></Link>
              ) : null}
              {!passed ? (
                <button type="button" className="btn-primary btn-lg w-full sm:w-auto" onClick={retryQuiz}><RotateCcw className="h-5 w-5" aria-hidden="true" /> Try the quiz again</button>
              ) : null}
              <Link href={backHref} className={`${passed && !next ? 'btn-primary' : 'btn-secondary'} btn-lg w-full sm:w-auto`}>{backLabel}</Link>
            </div>

            <section className="mt-12 sm:mt-16" aria-labelledby="review-heading">
              <div className="rule-head">
                <h2 id="review-heading" className="h-section">Your answers</h2>
                <span className="shrink-0 text-[13px] font-semibold text-ink-500 tabular">{score} of {quiz.length} correct</span>
              </div>
              <ol className="rows">
                {quiz.map((item, i) => {
                  const right = answers[i] === item.answer
                  return (
                    <li key={i} className="flex gap-3.5 py-5 sm:gap-5">
                      <span
                        className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${right ? 'bg-board-700' : 'bg-rose-600'}`}
                        role="img"
                        aria-label={right ? 'Correct' : 'Not correct'}
                      >
                        {right ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden="true" /> : <X className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 max-w-[62ch]">
                        <p className="whitespace-pre-line text-[17px] font-bold leading-snug text-ink-900">{i + 1}. {item.question}</p>
                        {!right && answers[i] != null ? (
                          <p className="mt-2 text-[15px] leading-snug text-rose-700"><span className="font-bold">You chose:</span> {item.options[answers[i]]}</p>
                        ) : null}
                        <p className={`${right ? 'mt-2' : 'mt-1'} text-[15px] leading-snug text-ink-900`}><span className="font-bold text-board-700">Correct answer:</span> {item.options[item.answer]}</p>
                        <p className="mt-2 whitespace-pre-line text-[15px] leading-[1.55] text-ink-600">{item.explanation}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button type="button" className="btn-secondary w-full sm:w-auto" onClick={restart}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Study the lesson again</button>
                {passed ? <button type="button" className="btn-ghost w-full sm:w-auto" onClick={retryQuiz}>Retake the quiz</button> : null}
              </div>
            </section>

            {actions ? <div className="mt-10">{actions}</div> : null}
          </div>
        ) : null}
      </div>

      {/* ── Bottom action bar ───────────────────────────────────── */}
      {step !== RESULT ? (
        <div className={`no-print fixed inset-x-0 z-30 border-t border-ink-200 bg-paper pb-[env(safe-area-inset-bottom)] ${barBottom} ${step === 0 ? 'md:hidden' : ''}`}>
          <div className="container-read flex items-center justify-between gap-3 py-3">
            {step === 0 ? (
              <button type="button" className="btn-primary btn-lg w-full" onClick={goNext}>Start lesson <ArrowRight className="h-5 w-5" aria-hidden="true" /></button>
            ) : step === QUIZ && hasQuiz ? (
              <>
                <span className="hidden text-sm font-semibold text-ink-500 tabular sm:block">
                  {answered > 0 ? `${rightSoFar} of ${answered} correct so far` : ''}
                </span>
                {locked ? (
                  <button type="button" className="btn-primary btn-lg group w-full sm:w-auto" onClick={nextQuestion}>
                    {qIndex + 1 < quiz.length ? 'Next question' : 'See my result'} <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
                  </button>
                ) : (
                  <button type="button" className="btn-primary btn-lg w-full sm:w-auto" disabled={picked == null} onClick={submitAnswer}>Check answer</button>
                )}
              </>
            ) : (
              <>
                <button type="button" className="btn-secondary btn-lg !px-4 sm:!px-5" onClick={goBack}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button>
                <button type="button" className="btn-primary btn-lg group flex-1 sm:flex-none" disabled={blocked} onClick={goNext}>
                  {step === sections.length ? (hasQuiz ? 'Start the quiz' : 'Finish') : 'Continue'} <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {showGlossary ? <Glossary items={lesson.glossary} onClose={closeGlossary} /> : null}
    </div>
  )
}
