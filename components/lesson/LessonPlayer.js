'use client'
// components/lesson/LessonPlayer.js
//
// The high-school lesson experience: one idea per screen.
//   intro -> sections (explain / example / check / mistake / summary) -> quiz -> result
// Takes a lesson object in the content/highschool JSON format, so it works the
// same online and from the offline Downloads library.
//
// Props:
//   lesson       the lesson JSON (required)
//   meta         subject display meta from lib/highschool/subjects.js (optional)
//   backHref     where the close (X) button goes
//   next         { href, title } of the next lesson (optional)
//   actions      extra node shown on the intro + result screens (e.g. download buttons)
//   onComplete   (score, total) => void, called when the quiz is finished
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Clock, Lightbulb,
  ListChecks, RotateCcw, Sparkles, Target, TriangleAlert, Trophy, X, XCircle,
} from 'lucide-react'
import { isPassed } from '@/lib/highschool/subjects'
import { saveProgress } from '@/lib/highschool/progress-client'

const LETTERS = ['A', 'B', 'C', 'D']

function Paragraphs({ text, className = '' }) {
  if (!text) return null
  return (
    <div className={`space-y-4 ${className}`}>
      {String(text).split(/\n\n+/).map((p, i) => (
        <p key={i} className="whitespace-pre-line text-[17px] leading-relaxed text-ink-700">{p}</p>
      ))}
    </div>
  )
}

function Figure({ svg }) {
  if (!svg) return null
  return (
    <figure
      className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white p-3 sm:p-5 [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-xl"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function Options({ options, answer, picked, onPick, locked }) {
  return (
    <div className="mt-5 grid gap-3" role="radiogroup">
      {options.map((opt, i) => {
        const isPicked = picked === i
        const isRight = i === answer
        let tone = 'border-ink-200 bg-white hover:border-blue-400 hover:bg-blue-50/40'
        let badge = 'bg-ink-100 text-ink-600'
        if (locked && isRight) { tone = 'border-emerald-500 bg-emerald-50'; badge = 'bg-emerald-600 text-white' }
        else if (locked && isPicked) { tone = 'border-rose-400 bg-rose-50'; badge = 'bg-rose-500 text-white' }
        else if (locked) { tone = 'border-ink-100 bg-white opacity-60' }
        else if (isPicked) { tone = 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'; badge = 'bg-blue-600 text-white' }
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={isPicked}
            disabled={locked}
            onClick={() => onPick(i)}
            className={`flex min-h-[56px] w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left text-[16px] text-ink-800 transition-all ${tone}`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${badge}`}>
              {locked && isRight ? <Check className="h-4 w-4" /> : locked && isPicked ? <X className="h-4 w-4" /> : LETTERS[i]}
            </span>
            <span className="whitespace-pre-line">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

function Feedback({ correct, explanation }) {
  return (
    <div
      role="status"
      className={`mt-5 flex gap-3 rounded-2xl border p-4 animate-fade-in-up ${correct ? 'border-emerald-200 bg-emerald-50' : 'border-sun-200 bg-sun-50'}`}
    >
      {correct
        ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        : <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-sun-600" />}
      <div>
        <p className={`text-sm font-bold ${correct ? 'text-emerald-800' : 'text-sun-600'}`}>
          {correct ? 'Correct!' : 'Not quite — here is why'}
        </p>
        <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-700">{explanation}</p>
      </div>
    </div>
  )
}

function Label({ icon: Icon, children, tone }) {
  return (
    <p className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${tone}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {children}
    </p>
  )
}

function ExampleSection({ section }) {
  const [shown, setShown] = useState(1)
  const total = section.steps.length
  const done = shown > total
  return (
    <div>
      <Label icon={Sparkles} tone="bg-sun-100 text-sun-600">Worked example</Label>
      <h2 className="font-display text-2xl font-bold text-ink-900">{section.title.replace(/^Worked example:\s*/i, '')}</h2>
      <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-400">The question</p>
        <p className="mt-1.5 whitespace-pre-line text-[17px] leading-relaxed text-ink-800">{section.problem}</p>
      </div>
      <ol className="mt-4 space-y-3">
        {section.steps.slice(0, Math.min(shown, total)).map((step, i) => (
          <li key={i} className="flex gap-3.5 rounded-2xl bg-white p-4 shadow-card animate-fade-in-up">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{i + 1}</span>
            <p className="whitespace-pre-line text-[16px] leading-relaxed text-ink-700">{step.replace(/^Step\s*\d+\s*[:.)-]\s*/i, '')}</p>
          </li>
        ))}
      </ol>
      {done ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 animate-fade-in-up">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Answer</p>
          <p className="mt-1.5 whitespace-pre-line text-[17px] font-medium leading-relaxed text-ink-900">{section.answer}</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-secondary btn-sm" onClick={() => setShown((n) => n + 1)}>
            {shown >= total ? 'Show the answer' : 'Show next step'} <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setShown(total + 1)}>Show all</button>
        </div>
      )}
    </div>
  )
}

function CheckSection({ section, value, onAnswer }) {
  const locked = value != null
  return (
    <div>
      <Label icon={Target} tone="bg-blue-50 text-blue-700">Quick check</Label>
      <h2 className="whitespace-pre-line font-display text-[22px] font-bold leading-snug text-ink-900">{section.question}</h2>
      <Options options={section.options} answer={section.answer} picked={value} locked={locked} onPick={onAnswer} />
      {locked ? <Feedback correct={value === section.answer} explanation={section.explanation} /> : (
        <p className="mt-4 text-sm text-ink-400">Choose an answer to continue. This one is just for practice.</p>
      )}
    </div>
  )
}

function Section({ section, checkValue, onCheck }) {
  switch (section.type) {
    case 'example':
      return <ExampleSection section={section} />
    case 'check':
      return <CheckSection section={section} value={checkValue} onAnswer={onCheck} />
    case 'mistake':
      return (
        <div>
          <Label icon={TriangleAlert} tone="bg-rose-50 text-rose-700">Watch out</Label>
          <h2 className="font-display text-2xl font-bold text-ink-900">{section.title.replace(/^Common mistake:\s*/i, '')}</h2>
          <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
            <Paragraphs text={section.body} />
          </div>
        </div>
      )
    case 'summary':
      return (
        <div>
          <Label icon={ListChecks} tone="bg-emerald-50 text-emerald-700">Key points</Label>
          <h2 className="font-display text-2xl font-bold text-ink-900">{section.title || 'Key points'}</h2>
          <ul className="mt-5 space-y-3">
            {section.bullets.map((b, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-white p-4 shadow-card">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-[16px] leading-relaxed text-ink-700">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    default:
      return (
        <div>
          <h2 className="font-display text-[26px] font-bold leading-tight text-ink-900 sm:text-3xl">{section.title}</h2>
          <Paragraphs text={section.body} className="mt-4" />
          {section.bullets?.length ? (
            <ul className="mt-5 space-y-2.5">
              {section.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-[16px] leading-relaxed text-ink-700">
                  <span className="mt-[9px] h-2 w-2 shrink-0 rounded-full bg-blue-600" />
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
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Key words"
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lift animate-fade-in-up sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink-900">Key words</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-ghost btn-sm !px-2"><X className="h-5 w-5" /></button>
        </div>
        <dl className="mt-4 divide-y divide-ink-100">
          {items.map((g) => (
            <div key={g.term} className="py-3">
              <dt className="text-[15px] font-semibold text-ink-900">{g.term}</dt>
              <dd className="mt-0.5 text-[15px] leading-relaxed text-ink-500">{g.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

function ScoreRing({ score, total, passed }) {
  const pct = total ? score / total : 0
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-ink-100" />
        <circle
          cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          className={`transition-[stroke-dashoffset] duration-1000 ease-out ${passed ? 'stroke-emerald-500' : 'stroke-sun-400'}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold text-ink-900">{score}<span className="text-xl text-ink-300">/{total}</span></span>
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
  const progressPct = Math.round((Math.min(step, RESULT) / RESULT) * 100 + (step === QUIZ ? (qIndex / quiz.length) * (100 / RESULT) : 0))

  const goNext = useCallback(() => {
    if (blocked) return
    setStep((s) => (!hasQuiz && s === QUIZ - 1 ? RESULT : Math.min(s + 1, RESULT)))
  }, [blocked, RESULT, QUIZ, hasQuiz])
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), [])

  useEffect(() => {
    function onKey(e) {
      if (step < 1 || step > sections.length) return
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, sections.length, goNext, goBack])

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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper">
      {/* ── Top bar: close, progress, key words ─────────────────── */}
      <div className="no-print sticky top-16 z-30 border-b border-ink-100 bg-white/95 backdrop-blur-md">
        <div className="container-read flex h-14 items-center gap-3">
          <Link href={backHref} aria-label="Leave lesson" className="btn-ghost btn-sm !px-2 text-ink-400"><X className="h-5 w-5" /></Link>
          <div className="progress-track flex-1" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Lesson progress">
            <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${meta?.bar || 'bg-blue-600'}`} style={{ width: `${progressPct}%` }} />
          </div>
          <span className="w-10 text-right text-xs font-semibold tabular-nums text-ink-400">{progressPct}%</span>
          {lesson.glossary?.length ? (
            <button type="button" onClick={() => setShowGlossary(true)} className="btn-ghost btn-sm !px-2.5">
              <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">Key words</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="container-read pb-36 pt-8 sm:pt-12">
        {/* ── Intro ─────────────────────────────────────────────── */}
        {step === 0 ? (
          <div className="animate-fade-in-up">
            <div className="flex flex-wrap items-center gap-2">
              {meta ? <span className={`chip ${meta.tile}`}>{meta.name}</span> : null}
              {lesson.form ? <span className="chip">Form {lesson.form} · Term {lesson.term}</span> : null}
              <span className="chip">{lesson.topic}</span>
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl">{lesson.title}</h1>
            <p className="lead mt-4">{lesson.summary}</p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
              <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-ink-300" /> About {lesson.minutes} minutes</span>
              <span className="inline-flex items-center gap-2"><ListChecks className="h-4 w-4 text-ink-300" /> {sections.length} short steps</span>
              {hasQuiz ? <span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-ink-300" /> {quiz.length}-question quiz</span> : null}
            </div>

            {lesson.objectives?.length ? (
              <div className="card card-pad mt-8">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-400">By the end you will be able to</p>
                <ul className="mt-3 space-y-2.5">
                  {(lesson.objectives || []).map((o, i) => (
                    <li key={i} className="flex gap-3 text-[16px] leading-relaxed text-ink-700">
                      <Target className="mt-1 h-4 w-4 shrink-0 text-blue-600" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {actions ? <div className="mt-6">{actions}</div> : null}
          </div>
        ) : null}

        {/* ── Teaching sections ─────────────────────────────────── */}
        {section ? (
          <div key={step} className="animate-fade-in-up">
            <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-ink-300">Step {step} of {sections.length}</p>
            <Section section={section} checkValue={checks[step]} onCheck={(i) => setChecks((c) => ({ ...c, [step]: i }))} />
          </div>
        ) : null}

        {/* ── Quiz ──────────────────────────────────────────────── */}
        {step === QUIZ && hasQuiz ? (
          <div key={`q${qIndex}`} className="animate-fade-in-up">
            <div className="mb-5 flex items-center justify-between">
              <Label icon={Trophy} tone="bg-ink-900 text-white">Lesson quiz</Label>
              <span className="text-sm font-semibold tabular-nums text-ink-400">Question {qIndex + 1} of {quiz.length}</span>
            </div>
            <h2 className="whitespace-pre-line font-display text-[22px] font-bold leading-snug text-ink-900 sm:text-2xl">{q.question}</h2>
            <Options options={q.options} answer={q.answer} picked={picked} locked={locked} onPick={setPicked} />
            {locked ? <Feedback correct={picked === q.answer} explanation={q.explanation} /> : null}
          </div>
        ) : null}

        {/* ── Result ────────────────────────────────────────────── */}
        {step === RESULT && !hasQuiz ? (
          <div className="animate-fade-in-up">
            <div className="card card-pad text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></span>
              <h1 className="mt-5 font-display text-3xl font-bold text-ink-900">Lesson complete</h1>
              <p className="mx-auto mt-2 max-w-md text-[16px] leading-relaxed text-ink-500">You have reached the end of this lesson. Go back over any step whenever you need to.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {next ? <Link href={next.href} className="btn-primary btn-lg">{next.title} <ArrowRight className="h-5 w-5" /></Link> : null}
                <Link href={backHref} className="btn-secondary btn-lg">Back</Link>
                <button type="button" className="btn-ghost btn-lg" onClick={restart}><RotateCcw className="h-4 w-4" /> Start again</button>
              </div>
            </div>
            {actions ? <div className="mt-6">{actions}</div> : null}
          </div>
        ) : null}

        {step === RESULT && hasQuiz ? (
          <div className="animate-fade-in-up">
            <div className="card card-pad text-center">
              <ScoreRing score={score} total={quiz.length} passed={passed} />
              <h1 className="mt-5 font-display text-3xl font-bold text-ink-900">
                {score === quiz.length ? 'Perfect score!' : passed ? 'Lesson complete' : 'Nearly there'}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-[16px] leading-relaxed text-ink-500">
                {passed
                  ? `You got ${score} out of ${quiz.length}. This lesson is now ticked off on your course page.`
                  : `You got ${score} out of ${quiz.length}. You need ${Math.ceil(quiz.length * 0.6)} to complete the lesson — look at the explanations below, then try again.`}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {passed && next ? (
                  <Link href={next.href} className="btn-primary btn-lg">Next lesson <ArrowRight className="h-5 w-5" /></Link>
                ) : null}
                {!passed ? (
                  <button type="button" className="btn-primary btn-lg" onClick={retryQuiz}><RotateCcw className="h-5 w-5" /> Try the quiz again</button>
                ) : null}
                <Link href={backHref} className="btn-secondary btn-lg">Back to course</Link>
              </div>
              {passed && next ? <p className="mt-3 text-sm text-ink-400">Up next: {next.title}</p> : null}
            </div>

            {actions ? <div className="mt-6">{actions}</div> : null}

            <h2 className="h-section mt-10">Review your answers</h2>
            <ol className="mt-4 space-y-3">
              {quiz.map((item, i) => {
                const right = answers[i] === item.answer
                return (
                  <li key={i} className="card p-5">
                    <div className="flex gap-3">
                      {right ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />}
                      <div className="min-w-0">
                        <p className="whitespace-pre-line text-[16px] font-semibold leading-snug text-ink-900">{i + 1}. {item.question}</p>
                        {!right && answers[i] != null ? (
                          <p className="mt-2 text-sm text-rose-600">Your answer: {item.options[answers[i]]}</p>
                        ) : null}
                        <p className="mt-1 text-sm font-medium text-emerald-700">Correct answer: {item.options[item.answer]}</p>
                        <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-500">{item.explanation}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn-secondary" onClick={restart}><RotateCcw className="h-4 w-4" /> Study the lesson again</button>
              {passed ? <button type="button" className="btn-ghost" onClick={retryQuiz}>Retake the quiz</button> : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Bottom action bar ───────────────────────────────────── */}
      {step !== RESULT ? (
        <div className="no-print fixed inset-x-0 bottom-16 z-30 border-t border-ink-100 bg-white/95 backdrop-blur-md md:bottom-0">
          <div className="container-read flex items-center justify-between gap-3 py-3">
            {step === 0 ? (
              <>
                <span className="hidden text-sm text-ink-400 sm:block">Take your time — you can stop and come back.</span>
                <button type="button" className="btn-primary btn-lg w-full sm:w-auto" onClick={goNext}>Start lesson <ArrowRight className="h-5 w-5" /></button>
              </>
            ) : step === QUIZ && hasQuiz ? (
              <>
                <span className="text-sm text-ink-400">{locked ? '' : 'Pick the best answer'}</span>
                {locked ? (
                  <button type="button" className="btn-primary btn-lg" onClick={nextQuestion}>
                    {qIndex + 1 < quiz.length ? 'Next question' : 'See my result'} <ArrowRight className="h-5 w-5" />
                  </button>
                ) : (
                  <button type="button" className="btn-primary btn-lg" disabled={picked == null} onClick={submitAnswer}>Check answer</button>
                )}
              </>
            ) : (
              <>
                <button type="button" className="btn-secondary" onClick={goBack}><ArrowLeft className="h-4 w-4" /> Back</button>
                <button type="button" className="btn-primary btn-lg" disabled={blocked} onClick={goNext}>
                  {step === sections.length ? (hasQuiz ? 'Start the quiz' : 'Finish') : 'Continue'} <ArrowRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {showGlossary ? <Glossary items={lesson.glossary} onClose={() => setShowGlossary(false)} /> : null}
    </div>
  )
}
