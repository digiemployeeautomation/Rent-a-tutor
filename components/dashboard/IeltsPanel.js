// components/dashboard/IeltsPanel.js — IELTS course: the band scale, the goal, then one ruled row per skill.
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SubjectArt from '@/components/art/SubjectArt'
import BandScale from '@/components/kit/BandScale'
import Segments from '@/components/kit/Segments'
import { IELTS_SECTIONS, ieltsSectionLabel } from '@/components/dashboard/ielts-ui'
import { band, daysUntil, formatDate, relativeTime } from '@/components/dashboard/format'

function Head() {
  return (
    <header className="rule-head">
      <h2 id="ielts-panel-title" className="h-section">IELTS</h2>
      <Link href="/practice" className="group -my-3 inline-flex shrink-0 items-center gap-1.5 py-3 text-sm font-bold text-copper-700 hover:text-copper-900">
        All IELTS practice <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
      </Link>
    </header>
  )
}

function Skills({ focus }) {
  return (
    <ul className="rows border-t border-ink-200">
      {IELTS_SECTIONS.map((s) => (
        <li key={s.key}>
          <Link href={`/practice#${s.key}`} className="group flex min-h-[64px] items-center gap-3 py-2.5 sm:gap-4">
            <SubjectArt name={s.key} tone="copper" className="h-10 w-10" />
            <span className="min-w-0 truncate text-base font-bold text-ink-900 decoration-ink-900 decoration-2 underline-offset-4 group-hover:underline">{s.label}</span>
            {focus === s.key ? <span className="chip-teal shrink-0">Your focus</span> : null}
            <ArrowRight className="nudge ml-auto h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

// One line of the goal list: label, dotted leader, value.
function Fact({ label, children }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      <dt className="flex min-w-0 flex-1 items-baseline gap-3 text-ink-600">
        <span className="shrink-0">{label}</span>
        <span className="leader" aria-hidden="true" />
      </dt>
      <dd className="min-w-0 text-right font-bold text-ink-900 tabular">{children}</dd>
    </div>
  )
}

// profile: user_ielts_profile row | null
// reading: { done, total } ; latest: { band, label, at, href } | null
export default function IeltsPanel({ profile, reading, latest }) {
  if (!profile) {
    return (
      <section className="min-w-0" aria-labelledby="ielts-panel-title">
        <Head />
        <div className="py-6 sm:py-7">
          <p className="text-[13px] font-semibold text-ink-500">Academic and General Training</p>
          <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-ink-700">
            Practise all four parts of the test and get feedback straight away: band scores on Writing and Speaking, and
            step-by-step Reading lessons. Tell us your target band and test date to get started.
          </p>
          <Link href="/onboarding" className="btn-secondary mt-5 w-full sm:w-auto">Set my IELTS goal</Link>
        </div>
        <Skills focus={null} />
      </section>
    )
  }

  const days = daysUntil(profile.test_date)
  const focusLabel = ieltsSectionLabel(profile.weakest_section)
  const course = `${profile.variant === 'general' ? 'General Training' : 'Academic'} preparation`
  const countdown = days == null || days < 0 ? null : days === 0 ? 'today' : `${days} ${days === 1 ? 'day' : 'days'} to go`

  return (
    <section className="min-w-0" aria-labelledby="ielts-panel-title">
      <Head />

      <div className="pb-5 pt-6 sm:pt-7">
        {latest ? (
          <div className="flex items-center gap-4">
            <Link href={latest.href || '/practice'} className="numeral text-[4rem] leading-[0.8] text-copper-700 decoration-2 underline-offset-8 hover:underline sm:text-[4.5rem]" aria-label={`Latest band ${band(latest.band)}: see the feedback`}>
              {band(latest.band)}
            </Link>
            <p className="min-w-0">
              <span className="block text-[17px] font-bold leading-snug text-ink-900">Latest band, in {latest.label}</span>
              <span className="mt-0.5 block text-[13px] font-semibold text-ink-500">{relativeTime(latest.at)} · {course}</span>
            </p>
          </div>
        ) : (
          <>
            <p className="text-[13px] font-semibold text-ink-500">{course}</p>
            <p className="mt-1.5 max-w-[46ch] text-[15px] leading-relaxed text-ink-700">
              <span className="font-bold text-ink-900">No band score yet.</span> Finish a Writing or Speaking task to get your first band score.
            </p>
          </>
        )}

        <BandScale band={latest ? latest.band : null} target={profile.target_band} className="mt-5" />

        <dl className="mt-6 text-[15px] leading-snug">
          <Fact label="Target band">{band(profile.target_band) ?? 'Not set'}</Fact>
          <Fact label="Test date">
            {profile.test_date ? formatDate(profile.test_date) : 'Not booked'}
            {countdown ? <span className="font-semibold text-ink-600"> · {countdown}</span> : null}
          </Fact>
          <Fact label="Focus">{focusLabel ?? 'All sections'}</Fact>
          {profile.hours_per_week ? <Fact label="Study plan">{profile.hours_per_week} h a week</Fact> : null}
          {reading.total > 0 ? (
            <Fact label="Reading lessons">
              <Link href="/learn/reading" className="group -my-2 inline-flex items-center gap-2.5 py-2 text-copper-700 hover:text-copper-900">
                <Segments total={reading.total} done={reading.done} tone="copper" className="w-16 sm:w-24" label={`${reading.done} of ${reading.total} reading drills done`} />
                <span>{reading.done} of {reading.total} drills</span>
                <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
              </Link>
            </Fact>
          ) : null}
        </dl>
      </div>

      <Skills focus={profile.weakest_section} />
    </section>
  )
}
