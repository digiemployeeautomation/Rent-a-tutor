'use client'

import { useState } from 'react'

const STEPS = ['variant', 'target', 'self', 'commitment', 'review']

const VARIANT_OPTIONS = [
  { value: 'academic', title: 'Academic',         desc: 'For university admission abroad.' },
  { value: 'general',  title: 'General Training', desc: 'For work, migration, or visa.' },
]

const SECTION_OPTIONS = [
  { value: 'listening', label: 'Listening' },
  { value: 'reading',   label: 'Reading'   },
  { value: 'writing',   label: 'Writing'   },
  { value: 'speaking',  label: 'Speaking'  },
]

const BAND_OPTIONS = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]

export default function IELTSQuestionnaire({ onSubmit }) {
  const [step, setStep] = useState(STEPS[0])
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

  function update(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  function nextStep() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function prevStep() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
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

  const currentIdx = STEPS.indexOf(step)

  return (
    <div className="space-y-8">
      <StepDots current={currentIdx} total={STEPS.length} />

      {step === 'variant'    && <VariantStep    value={answers.variant}    onChange={(v) => update('variant', v)}    onNext={nextStep} />}
      {step === 'target'     && <TargetStep     answers={answers}          onChange={update}                          onNext={nextStep} onBack={prevStep} />}
      {step === 'self'       && <SelfStep       answers={answers}          onChange={update}                          onNext={nextStep} onBack={prevStep} />}
      {step === 'commitment' && <CommitmentStep answers={answers}          onChange={update}                          onNext={nextStep} onBack={prevStep} />}
      {step === 'review'     && <ReviewStep     answers={answers}          onBack={prevStep} onSubmit={handleSubmit} saving={saving} error={error} />}
    </div>
  )
}

function StepDots({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const isCurrent = i === current
        const isDone = i < current
        return (
          <div
            key={i}
            className={`rounded-full transition-all ${
              isCurrent ? 'w-3 h-3 bg-blue-600'
              : isDone   ? 'w-3 h-3 bg-blue-400'
                         : 'w-2.5 h-2.5 bg-gray-300'
            }`}
          />
        )
      })}
    </div>
  )
}

function VariantStep({ value, onChange, onNext }) {
  return (
    <div className="space-y-6">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Which IELTS are you preparing for?</h2>
        <p className="mt-2 text-gray-600">Listening and Speaking are the same for both. Reading and Writing differ.</p>
      </header>
      <div className="space-y-3">
        {VARIANT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex w-full items-start gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              value === opt.value ? 'border-blue-600 bg-blue-50' : 'border-blue-200 bg-white hover:border-blue-400'
            }`}
          >
            <div>
              <div className="font-semibold text-gray-800">{opt.title}</div>
              <div className="mt-1 text-sm text-gray-500">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <NextButton disabled={!value} onClick={onNext} />
    </div>
  )
}

function TargetStep({ answers, onChange, onNext, onBack }) {
  return (
    <div className="space-y-6">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">What band are you aiming for?</h2>
        <p className="mt-2 text-gray-600">Pick your overall target. You can add per-section targets later.</p>
      </header>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {BAND_OPTIONS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => onChange('target_band', b)}
            className={`rounded-xl border-2 py-3 text-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              answers.target_band === b ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-200 bg-white text-gray-700 hover:border-blue-400'
            }`}
          >
            {b.toFixed(1)}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">When is your test? (optional)</label>
        <input
          type="date"
          value={answers.test_date || ''}
          onChange={(e) => onChange('test_date', e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!answers.target_band} />
    </div>
  )
}

function SelfStep({ answers, onChange, onNext, onBack }) {
  return (
    <div className="space-y-6">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Where do you stand today?</h2>
        <p className="mt-2 text-gray-600">If you have never taken IELTS, leave this blank — we will figure it out.</p>
      </header>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Approximate current band</label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          <button
            type="button"
            onClick={() => onChange('current_band_self', null)}
            className={`rounded-xl border-2 py-3 text-center text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              answers.current_band_self == null ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300'
            }`}
          >
            Not sure
          </button>
          {BAND_OPTIONS.slice(0, 9).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onChange('current_band_self', b)}
              className={`rounded-xl border-2 py-3 text-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                answers.current_band_self === b ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-200 bg-white text-gray-700 hover:border-blue-400'
              }`}
            >
              {b.toFixed(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Which section feels weakest?</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SECTION_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange('weakest_section', s.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                answers.weakest_section === s.value
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={false} />
    </div>
  )
}

function CommitmentStep({ answers, onChange, onNext, onBack }) {
  return (
    <div className="space-y-6">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">How much time can you put in?</h2>
        <p className="mt-2 text-gray-600">We will tune your study plan to match.</p>
      </header>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Hours per week</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[2, 5, 10, 15].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onChange('hours_per_week', h)}
              className={`rounded-xl border-2 py-4 text-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                answers.hours_per_week === h ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-200 bg-white text-gray-700 hover:border-blue-400'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">First language (optional)</label>
        <input
          type="text"
          value={answers.first_language}
          onChange={(e) => onChange('first_language', e.target.value)}
          placeholder="e.g. Bemba, Swahili, French"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <p className="text-xs text-gray-400">We use this to spot common errors specific to speakers of your language.</p>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!answers.hours_per_week} />
    </div>
  )
}

function ReviewStep({ answers, onBack, onSubmit, saving, error }) {
  const variantLabel = answers.variant === 'academic' ? 'Academic' : 'General Training'
  return (
    <div className="space-y-6">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Looks good?</h2>
        <p className="mt-2 text-gray-600">We will use this to recommend your first practice items.</p>
      </header>

      <dl className="space-y-2 rounded-2xl bg-gray-50 p-5">
        <ReviewRow label="IELTS variant"    value={variantLabel} />
        <ReviewRow label="Target band"      value={answers.target_band?.toFixed(1) ?? '—'} />
        <ReviewRow label="Test date"        value={answers.test_date || 'Not booked'} />
        <ReviewRow label="Current band"     value={answers.current_band_self != null ? answers.current_band_self.toFixed(1) : 'Not sure'} />
        <ReviewRow label="Weakest section"  value={answers.weakest_section ? capitalize(answers.weakest_section) : '—'} />
        <ReviewRow label="Hours per week"   value={answers.hours_per_week ? `${answers.hours_per_week}h` : '—'} />
        <ReviewRow label="First language"   value={answers.first_language?.trim() || '—'} />
      </dl>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-opacity hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Start preparing'}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="w-full rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-60"
        >
          Back
        </button>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-2 last:border-b-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-800">{value}</dd>
    </div>
  )
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function NextButton({ disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-opacity hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60"
    >
      Continue
    </button>
  )
}

function NavButtons({ onBack, onNext, nextDisabled }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse">
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-opacity hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 sm:w-auto"
      >
        Continue
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 sm:w-auto"
      >
        Back
      </button>
    </div>
  )
}
