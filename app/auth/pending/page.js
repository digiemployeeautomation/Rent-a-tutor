// Shown after sign-up when the account still needs its email confirmed.
import Link from 'next/link'
import AuthShell from '@/components/marketing/AuthShell'

export const metadata = { title: 'Check your email' }

const STEPS = [
  'Open the email we just sent you.',
  'Tap the link inside to confirm your account.',
  'Come back and log in to start learning.',
]

export default function PendingPage({ searchParams }) {
  const email = typeof searchParams?.email === 'string' ? searchParams.email : ''

  return (
    <AuthShell
      boardLine={<>One more step, then <span className="text-sun-300">you are in.</span></>}
      footer={
        <p className="text-[15px] leading-relaxed text-ink-600">
          No email after a few minutes? Check your spam folder, or{' '}
          <Link href="/auth/register" className="link">sign up again</Link>.
        </p>
      }
    >
      <h1 className="h-page">Check your email</h1>
      <p className="mt-2.5 text-[17px] leading-[1.5] text-ink-600">
        Your account is almost ready. We sent a confirmation link to{' '}
        {email ? <span className="break-all font-bold text-ink-900">{email}</span> : 'your email address'}.
      </p>

      <ol className="mt-7 border-t-2 border-ink-900">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-4 border-b border-ink-200 py-3.5 text-base font-semibold text-ink-800">
            <span className="numeral w-6 shrink-0 text-[1.75rem] leading-none text-copper-600" aria-hidden="true">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/auth/login" className="btn-primary btn-lg">Go to log in</Link>
        <Link href="/learn/high-school" className="btn-secondary btn-lg">Browse lessons</Link>
      </div>
    </AuthShell>
  )
}
