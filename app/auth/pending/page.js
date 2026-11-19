// Shown after sign-up when the account still needs its email confirmed.
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
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
      footer={
        <p className="text-center text-sm text-ink-500">
          No email after a few minutes? Check your spam folder, or{' '}
          <Link href="/auth/register" className="font-semibold text-blue-700 hover:underline">sign up again</Link>.
        </p>
      }
    >
      <span className="icon-tile h-14 w-14 rounded-2xl bg-blue-50 text-blue-600">
        <MailCheck className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="h-page mt-5">Check your email</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
        Your account is almost ready. We sent a confirmation link to{' '}
        {email ? <span className="font-semibold text-ink-900 break-all">{email}</span> : 'your email address'}.
      </p>

      <ol className="mt-6 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-[15px] text-ink-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Link href="/auth/login" className="btn-primary">Go to log in</Link>
        <Link href="/learn/high-school" className="btn-secondary">Browse lessons</Link>
      </div>
    </AuthShell>
  )
}
