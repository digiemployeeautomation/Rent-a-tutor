'use client'

// IELTS goal questionnaire — one question per step. Submits the same answer
// object as before ({ variant, target_band, test_date, current_band_self,
// weakest_section, hours_per_week, first_language }) via onSubmit.
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import SubjectArt from '@/components/art/SubjectArt'
import Segments from '@/components/kit/Segments'
import BandScale from '@/components/kit/BandScale'

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
// Roughly what each weekly total means per day, so the choice is concrete.
const HOUR_NOTES = { 2: 'About 20 minutes a day', 5: 'About 45 minutes a day', 10: 'About an hour and a half a day', 15: 'About 2 hours a day' }

const STEPS = [
  { key: 'variant', title: 'Which IELTS are you preparing for?', hint: 'Listening and Speaking are the same in both. Reading and Writing are different.' },
  { key: 'target', title: 'What band score do you need?', hint: 'Pick your overall target. You can change it later.' },
  { key: 'date', title: 'When is your test?', hint: 'If you have not booked it yet, skip this step.', optional: true },
  { key: 'current', title: 'What is your level today?', hint: 'Your best guess is fine. Choose "Not sure" if you have never taken IELTS.', optional: true },
  { key: 'weakest', title: 'Which part feels hardest?', hint: 'We will point you to practice for it first.', optional: true },
  { key: 'hours', title: 'How many hours a week can you study?', hint: 'Be honest. A little every week works better than a lot once.' },
  { key: 'language', title: 'What is your first language?', hint: 'This helps us spot mistakes that are common for speakers of your language.', optional: true },
  { key: 'review', title: 'Check your answers', hint: 'You can change any of these later.' },
]

// One tappable answer. Selected = chalkboard-green border on a pale green fill.
function Choice({ selected, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-lg border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-board-600 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
        selected
          ? 'border-board-700 bg-board-50 text-ink-900 ring-1 ring-inset ring-board-700'
          : 'border-ink-300 bg-white text-ink-900 hover:border-ink-900'
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
        <div className="mb-2.5 flex items-baseline justify-between gap-4 text-[13px] font-semibold text-ink-500">
          <span><span className="font-bold text-copper-700">IELTS goal</span> · Step <span className="tabular text-ink-900">{index + 1}</span> of {STEPS.length}</span>
          {step.optional ? <span>Optional</span> : null}
        </div>
        <Segments total={STEPS.length} done={index + 1} tone="copper" label={`Step ${index + 1} of ${STEPS.length}`} />
      </div>

      <div key={step.key} className="mt-9 animate-fade-in-up sm:mt-12">
        <h1 className="h-page text-balance">{step.title}</h1>
        <p className="mt-2.5 max-w-[52ch] text-[17px] leading-[1.5] text-ink-600">{step.hint}</p>

        <div className="mt-7">
          {step.key === 'variant' && (
            <div className="space-y-3">
              {VARIANT_OPTIONS.map((opt) => (
                <Choice key={opt.value} selected={answers.variant === opt.value} onClick={() => update('variant', opt.value)} className="flex min-h-[72px] w-full items-center gap-4 px-4 py-3.5 sm:px-5">
                  <Dot on={answers.variant === opt.value} />
                  <span className="flex-1">
                    <span className="block text-[17px] font-bold leading-snug">{opt.title}</span>
                    <span className="mt-0.5 block text-[15px] leading-snug text-ink-600">{opt.desc}</span>
                  </span>
                </Choice>
              ))}
            </div>
          )}

          {step.key === 'target' && (
            <>
              <BandGrid value={answers.target_band} onChange={(b) => update('target_band', b)} bands={BAND_OPTIONS} />
              <div className="mt-8 border-t border-ink-200 pt-5">
                <p className="text-[13px] font-semibold text-ink-500">
                  {answers.target_band
                    ? <>Your target on the IELTS scale: <span className="font-bold text-copper-700">band {answers.target_band.toFixed(1)}</span></>
                    : 'The IELTS scale. Your target will be marked here.'}
                </p>
                <BandScale band={null} target={answers.target_band} className="mt-1 max-w-md" />
              </div>
            </>
          )}

          {step.key === 'date' && (
            <div className="max-w-sm">
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
            <div>
              <Choice selected={answers.current_band_self == null} onClick={() => update('current_band_self', null)} className="flex min-h-[56px] w-full items-center gap-4 px-4 sm:px-5">
                <Dot on={answers.current_band_self == null} />
                <span className="text-[17px] font-bold">Not sure</span>
              </Choice>
              <p className="mb-2.5 mt-6 text-[13px] font-semibold text-ink-500">Or pick a band</p>
              <BandGrid value={answers.current_band_self} onChange={(b) => update('current_band_self', b)} bands={BAND_OPTIONS.slice(0, 9)} />
            </div>
          )}

          {step.key === 'weakest' && (
            <div className="space-y-3">
              {SECTION_OPTIONS.map((s) => (
                <Choice key={s.value} selected={answers.weakest_section === s.value} onClick={() => update('weakest_section', answers.weakest_section === s.value ? null : s.value)} className="flex min-h-[68px] w-full items-center gap-4 px-4 py-2.5 sm:px-5">
                  <SubjectArt name={s.value} tone="copper" className="h-11 w-11" />
                  <span className="flex-1 text-[17px] font-bold">{s.label}</span>
                  <Dot on={answers.weakest_section === s.value} />
                </Choice>
              ))}
            </div>
          )}

          {step.key === 'hours' && (
            <div className="space-y-3">
              {HOUR_OPTIONS.map((h) => (
                <Choice key={h} selected={answers.hours_per_week === h} onClick={() => update('hours_per_week', h)} className="flex min-h-[68px] w-full items-center gap-4 px-4 py-2.5 sm:px-5">
                  <span className="numeral w-11 shrink-0 text-center text-[2rem] leading-none text-copper-600">{h}</span>
                  <span className="flex-1">
                    <span className="block text-[17px] font-bold leading-snug">hours a week</span>
                    <span className="mt-0.5 block text-[15px] leading-snug text-ink-600">{HOUR_NOTES[h]}</span>
                  </span>
                  <Dot on={answers.hours_per_week === h} />
                </Choice>
              ))}
            </div>
          )}

          {step.key === 'language' && (
            <div className="max-w-sm">
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
            <dl className="border-t-2 border-ink-900">
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
          <p role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[15px] font-semibold leading-snug text-rose-800">{error}</p>
        ) : null}
      </div>

      {/* Back / Next */}
      <div className="mt-10 flex items-center gap-3">
        {index > 0 ? (
          <button type="button" onClick={back} disabled={saving} className="btn-secondary btn-lg !px-5">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back
          </button>
        ) : null}
        {isLast ? (
          <button type="button" onClick={handleSubmit} disabled={saving} className="btn-primary btn-lg flex-1 sm:flex-none">
            {saving ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Saving…</> : <>Save my goal <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" /></>}
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
    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
      {bands.map((b) => (
        <Choice key={b} selected={value === b} onClick={() => onChange(b)} className="numeral flex min-h-[56px] items-center justify-center text-[1.375rem]">
          {b.toFixed(1)}
        </Choice>
      ))}
    </div>
  )
}

// Radio dot for a row choice.
function Dot({ on }) {
  return (
    <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-white ${on ? 'border-board-700' : 'border-ink-300'}`} aria-hidden="true">
      <span className={`h-2.5 w-2.5 rounded-full bg-board-700 transition-transform duration-150 ease-out ${on ? 'scale-100' : 'scale-0'}`} />
    </span>
  )
}

function ReviewRow({ label, value, onEdit }) {
  return (
    <div className="flex min-h-[56px] items-center gap-3 border-b border-ink-200 py-1.5">
      <dt className="w-28 shrink-0 text-[15px] text-ink-600 sm:w-40">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-base font-bold text-ink-900">{value}</span>
        <button type="button" onClick={onEdit} className="inline-flex min-h-[44px] shrink-0 items-center px-1 text-sm font-semibold text-ink-900 underline decoration-ink-300 underline-offset-4 hover:decoration-ink-900" aria-label={`Change ${label.toLowerCase()}`}>Change</button>
      </dd>
    </div>
  )
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
