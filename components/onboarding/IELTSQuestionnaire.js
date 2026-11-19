'use client'

// IELTS goal questionnaire — one question per step. Submits the same answer
// object as before ({ variant, target_band, test_date, current_band_self,
// weakest_section, hours_per_week, first_language }) via onSubmit.
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'

const VARIANT_OPTIONS = [
  { value: 'academic', title: 'Academic', desc: 'For studying at a university or college abroad.' },
  { value: 'general', title: 'General Training', desc: 'For work, migration or a visa.' },
]

const SECTION_OPTIONS = [
  { value: 'listening', label: 'Listening' },
  { value: 'reading', label: 'Reading' },
  { value: 'writing', label: 'Writing' },
  { value: 'speaking', label: 'Speaking' },
]

const BAND_OPTIONS = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]
const HOUR_OPTIONS = [2, 5, 10, 15]

const STEPS = [
  { key: 'variant', title: 'Which IELTS are you preparing for?', hint: 'Listening and Speaking are the same in both. Reading and Writing are different.' },
  { key: 'target', title: 'What band score do you need?', hint: 'Pick your overall target. You can change it later.' },
  { key: 'date', title: 'When is your test?', hint: 'If you have not booked it yet, skip this step.', optional: true },
  { key: 'current', title: 'What is your level today?', hint: 'Your best guess is fine. Choose "Not sure" if you have never taken IELTS.', optional: true },
  { key: 'weakest', title: 'Which part feels hardest?', hint: 'We will point you to practice for it first.', optional: true },
  { key: 'hours', title: 'How many hours a week can you study?', hint: 'Be honest — a little every week works better than a lot once.' },
  { key: 'language', title: 'What is your first language?', hint: 'This helps us spot mistakes that are common for speakers of your language.', optional: true },
  { key: 'review', title: 'Check your answers', hint: 'You can change any of these later.' },
]

function Choice({ selected, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative rounded-2xl border-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.99] ${
        selected ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-ink-100 bg-white text-ink-800 hover:border-ink-200 hover:bg-ink-50'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export default function IELTSQuestionnaire({ onSubmit }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({
    variant: null,
    target_band: null,
    test_date: null,
    current_band_self: null,
    weakest_section: null,
    hours_per_week: null,
    first_language: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const step = STEPS[index]
  const isLast = index === STEPS.length - 1
  const progress = Math.round(((index + 1) / STEPS.length) * 100)

  function update(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  function canContinue() {
    if (step.key === 'variant') return !!answers.variant
    if (step.key === 'target') return !!answers.target_band
    if (step.key === 'hours') return !!answers.hours_per_week
    return true
  }

  function next() {
    if (!canContinue()) return
    setIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  function back() {
    setError(null)
    setIndex((i) => Math.max(i - 1, 0))
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        ...answers,
        // strip empty strings so the API treats them as absent
        first_language: answers.first_language.trim() || null,
        test_date: answers.test_date || null,
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const stepHasAnswer = {
    date: !!answers.test_date,
    current: answers.current_band_self != null,
    weakest: !!answers.weakest_section,
    language: !!answers.first_language.trim(),
  }[step.key]

  return (
    <div className="animate-fade-in">
      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-400">
          <span>Step {index + 1} of {STEPS.length}</span>
          {step.optional ? <span className="chip">Optional</span> : null}
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={index + 1} aria-label="Questionnaire progress">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div key={step.key} className="mt-8 animate-fade-in-up">
        <h1 className="h-page">{step.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{step.hint}</p>

        <div className="mt-6">
          {step.key === 'variant' && (
            <div className="space-y-3">
              {VARIANT_OPTIONS.map((opt) => (
                <Choice key={opt.value} selected={answers.variant === opt.value} onClick={() => update('variant', opt.value)} className="flex w-full items-center gap-4 px-5 py-4">
                  <span className="flex-1">
                    <span className="block text-base font-semibold">{opt.title}</span>
                    <span className="mt-0.5 block text-sm text-ink-500">{opt.desc}</span>
                  </span>
                  <Tick on={answers.variant === opt.value} />
                </Choice>
              ))}
            </div>
          )}

          {step.key === 'target' && (
            <BandGrid value={answers.target_band} onChange={(b) => update('target_band', b)} bands={BAND_OPTIONS} />
          )}

          {step.key === 'date' && (
            <div>
              <label htmlFor="test-date" className="label">Test date</label>
              <input
                id="test-date"
                type="date"
                value={answers.test_date || ''}
                onChange={(e) => update('test_date', e.target.value)}
                className="field min-h-[52px]"
              />
            </div>
          )}

          {step.key === 'current' && (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
              <Choice selected={answers.current_band_self == null} onClick={() => update('current_band_self', null)} className="col-span-3 flex min-h-[52px] items-center justify-center px-3 text-sm font-semibold sm:col-span-5">
                Not sure
              </Choice>
              {BAND_OPTIONS.slice(0, 9).map((b) => (
                <Choice key={b} selected={answers.current_band_self === b} onClick={() => update('current_band_self', b)} className="flex min-h-[52px] items-center justify-center font-display text-lg font-bold">
                  {b.toFixed(1)}
                </Choice>
              ))}
            </div>
          )}

          {step.key === 'weakest' && (
            <div className="grid grid-cols-2 gap-3">
              {SECTION_OPTIONS.map((s) => (
                <Choice key={s.value} selected={answers.weakest_section === s.value} onClick={() => update('weakest_section', answers.weakest_section === s.value ? null : s.value)} className="flex min-h-[64px] items-center justify-between px-4 text-base font-semibold">
                  {s.label}
                  <Tick on={answers.weakest_section === s.value} />
                </Choice>
              ))}
            </div>
          )}

          {step.key === 'hours' && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {HOUR_OPTIONS.map((h) => (
                <Choice key={h} selected={answers.hours_per_week === h} onClick={() => update('hours_per_week', h)} className="flex min-h-[72px] flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold">{h}</span>
                  <span className="text-xs font-medium text-ink-500">hours a week</span>
                </Choice>
              ))}
            </div>
          )}

          {step.key === 'language' && (
            <div>
              <label htmlFor="first-language" className="label">First language</label>
              <input
                id="first-language"
                type="text"
                value={answers.first_language}
                onChange={(e) => update('first_language', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') next() }}
                placeholder="e.g. Bemba, Nyanja, Tonga"
                className="field min-h-[52px]"
                autoComplete="off"
              />
            </div>
          )}

          {step.key === 'review' && (
            <dl className="card divide-y divide-ink-100">
              <ReviewRow label="IELTS type" value={answers.variant === 'general' ? 'General Training' : 'Academic'} onEdit={() => setIndex(0)} />
              <ReviewRow label="Target band" value={answers.target_band?.toFixed(1) ?? '—'} onEdit={() => setIndex(1)} />
              <ReviewRow label="Test date" value={answers.test_date || 'Not booked'} onEdit={() => setIndex(2)} />
              <ReviewRow label="Level today" value={answers.current_band_self != null ? answers.current_band_self.toFixed(1) : 'Not sure'} onEdit={() => setIndex(3)} />
              <ReviewRow label="Hardest part" value={answers.weakest_section ? capitalize(answers.weakest_section) : '—'} onEdit={() => setIndex(4)} />
              <ReviewRow label="Study time" value={answers.hours_per_week ? `${answers.hours_per_week} hours a week` : '—'} onEdit={() => setIndex(5)} />
              <ReviewRow label="First language" value={answers.first_language?.trim() || '—'} onEdit={() => setIndex(6)} />
            </dl>
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}
      </div>

      {/* Back / Next */}
      <div className="mt-10 flex items-center gap-3">
        {index > 0 ? (
          <button type="button" onClick={back} disabled={saving} className="btn-secondary btn-lg px-5">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back
          </button>
        ) : null}
        {isLast ? (
          <button type="button" onClick={handleSubmit} disabled={saving} className="btn-primary btn-lg flex-1 sm:flex-none">
            {saving ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Saving…</> : <>Save my goal <Check className="h-5 w-5" aria-hidden="true" /></>}
          </button>
        ) : (
          <button type="button" onClick={next} disabled={!canContinue()} className="btn-primary btn-lg flex-1 sm:flex-none">
            {step.optional && !stepHasAnswer ? 'Skip this step' : 'Next'} <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

function BandGrid({ value, onChange, bands }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {bands.map((b) => (
        <Choice key={b} selected={value === b} onClick={() => onChange(b)} className="flex min-h-[56px] items-center justify-center font-display text-lg font-bold">
          {b.toFixed(1)}
        </Choice>
      ))}
    </div>
  )
}

function Tick({ on }) {
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-ink-200 bg-white'}`} aria-hidden="true">
      {on ? <Check className="h-3.5 w-3.5" /> : null}
    </span>
  )
}

function ReviewRow({ label, value, onEdit }) {
  return (
    <div className="flex min-h-[56px] items-center gap-3 py-2 pl-4 pr-2 sm:pl-5">
      <dt className="w-28 shrink-0 text-sm text-ink-500 sm:w-36">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{value}</span>
        <button type="button" onClick={onEdit} className="btn-ghost btn-sm min-h-[44px] shrink-0 text-blue-700" aria-label={`Change ${label.toLowerCase()}`}>Change</button>
      </dd>
    </div>
  )
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
