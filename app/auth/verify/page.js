import Link from 'next/link'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <div className="w-full max-w-md text-center">

        <Link href="/" className="block font-serif text-2xl mb-10" style={{ color: 'var(--color-primary)' }}>
          Rent a <span style={{ color: 'var(--color-accent)' }} className="italic">Tutor</span>
        </Link>

        {/* Email icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          ✉️
        </div>

        <h1 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-primary)' }}>
          Check your email
        </h1>

        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          We sent a confirmation link to your email address.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Click the link in the email to confirm your account and you&apos;ll be taken straight to your dashboard.
        </p>

        {/* Steps */}
        <div
          className="rounded-2xl p-6 text-left mb-8"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="space-y-4">
            {[
              { n: '1', text: 'Open your email inbox' },
              { n: '2', text: 'Find the email from Rent a Tutor' },
              { n: '3', text: 'Click the confirmation link' },
              { n: '4', text: 'You\'ll be taken to your dashboard' },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-nav-text)' }}
                >
                  {s.n}
                </div>
                <span className="text-sm text-gray-700">{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Didn&apos;t receive an email? Check your spam folder or try again.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/register"
            className="text-sm py-2.5 rounded-lg font-medium text-center"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
          >
            Try signing up again
          </Link>
          <Link
            href="/auth/login"
            className="text-sm py-2.5 rounded-lg text-center border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            Back to login
          </Link>
        </div>

      </div>
    </div>
  )
}
