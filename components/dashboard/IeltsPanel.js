// components/dashboard/IeltsPanel.js — IELTS course summary (teal).
import Link from 'next/link'
import { ArrowRight, BookOpenCheck, Check, Languages } from 'lucide-react'
import { IELTS_SECTIONS, ieltsSectionLabel } from '@/components/dashboard/ielts-ui'
import { band, daysUntil, formatDate, relativeTime } from '@/components/dashboard/format'

function Header({ subtitle, chip }) {
  return (
    <div className="flex items-start gap-3">
      <span className="icon-tile bg-teal-50 text-teal-700"><Languages className="h-5 w-5" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <h2 id="ielts-panel-title" className="h-section">IELTS</h2>
        <p className="muted mt-0.5">{subtitle}</p>
      </div>
      {chip}
    </div>
  )
}

function QuickStart({ focus }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Start practising</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {IELTS_SECTIONS.map((s) => {
          const Icon = s.icon
          const isFocus = focus === s.key
          return (
            <Link
              key={s.key}
              href={`/practice#${s.key}`}
              className={`flex min-h-[48px] items-center gap-2.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                isFocus
                  ? 'border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100'
                  : 'border-ink-100 bg-white text-ink-800 hover:border-teal-200 hover:bg-teal-50/60'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
              <span className="truncate">{s.label}</span>
              {isFocus ? <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-teal-700">Focus</span> : null}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// profile: user_ielts_profile row | null
// reading: { done, total } ; latest: { band, label, at, href } | null
export default function IeltsPanel({ profile, reading, latest }) {
  if (!profile) {
    return (
      <section className="card card-pad flex flex-col" aria-labelledby="ielts-panel-title">
        <Header subtitle="Academic and General Training" />
        <p className="mt-5 text-[15px] leading-relaxed text-ink-700">
          Practise all four parts of the test and get feedback straight away. Tell us your target band and test date to get started.
        </p>
        <ul className="mt-4 space-y-2.5 text-sm text-ink-700">
          {['Listening, Reading, Writing and Speaking practice', 'Band-score feedback on Writing and Speaking', 'Step-by-step Reading lessons'].map((t) => (
            <li key={t} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span>
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
          <Link href="/onboarding" className="btn-primary flex-1">Set my IELTS goal</Link>
          <Link href="/practice" className="btn-secondary flex-1">Browse IELTS practice</Link>
        </div>
      </section>
    )
  }

  const days = daysUntil(profile.test_date)
  const readingPct = reading.total > 0 ? Math.round((reading.done / reading.total) * 100) : 0
  const focusLabel = ieltsSectionLabel(profile.weakest_section)

  return (
    <section className="card card-pad flex flex-col" aria-labelledby="ielts-panel-title">
      <Header
        subtitle={`${profile.variant === 'general' ? 'General Training' : 'Academic'} preparation`}
        chip={profile.hours_per_week ? <span className="chip-teal shrink-0">{profile.hours_per_week} h a week</span> : null}
      />

      <dl className="mt-5 grid grid-cols-3 divide-x divide-teal-100 rounded-xl bg-teal-50/70">
        <div className="px-3 py-3 sm:px-4">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-teal-700/80">Target</dt>
          <dd className="mt-0.5 font-display text-2xl font-bold text-ink-900">{band(profile.target_band) ?? '—'}</dd>
        </div>
        <div className="px-3 py-3 sm:px-4">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-teal-700/80">Test date</dt>
          {days != null && days >= 0 ? (
            <dd className="mt-0.5">
              <span className="font-display text-2xl font-bold text-ink-900">{days}</span>
              <span className="ml-1 text-sm text-ink-500">{days === 1 ? 'day' : 'days'}</span>
              <span className="block truncate text-xs text-ink-500">{formatDate(profile.test_date)}</span>
            </dd>
          ) : (
            <dd className="mt-1.5 text-sm font-medium text-ink-500">{profile.test_date ? formatDate(profile.test_date) : 'Not booked'}</dd>
          )}
        </div>
        <div className="px-3 py-3 sm:px-4">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-teal-700/80">Focus</dt>
          <dd className="mt-1.5 text-[15px] font-semibold text-ink-900">{focusLabel ?? 'All sections'}</dd>
        </div>
      </dl>

      {reading.total > 0 ? (
        <Link href="/learn/reading" className="group mt-4 block rounded-xl border border-ink-100 p-4 transition-colors hover:border-teal-200 hover:bg-teal-50/40">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <BookOpenCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
            Reading lessons
            <span className="ml-auto text-sm font-medium tabular-nums text-ink-500">{reading.done} of {reading.total} drills</span>
          </span>
          <span className="progress-track mt-2.5 block" aria-hidden="true">
            <span className="progress-fill block bg-teal-600" style={{ width: `${readingPct}%` }} />
          </span>
        </Link>
      ) : null}

      <p className="mt-4 text-sm text-ink-500">
        {latest ? (
          <>
            Latest band{' '}
            <Link href={latest.href || '/practice'} className="font-semibold text-teal-700 hover:underline">{band(latest.band)}</Link>
            {' '}in {latest.label} · {relativeTime(latest.at)}
          </>
        ) : (
          'No band score yet. Finish a Writing or Speaking task to get your first band score.'
        )}
      </p>

      <div className="mt-5 border-t border-ink-100 pt-5">
        <QuickStart focus={profile.weakest_section} />
      </div>

      <Link href="/practice" className="group mt-auto inline-flex min-h-[44px] items-center gap-1.5 self-start pt-4 text-sm font-semibold text-teal-700">
        All IELTS practice
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </section>
  )
}
