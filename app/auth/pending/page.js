import Link from 'next/link'

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <div className="w-full max-w-md text-center">

        <Link href="/" className="block font-serif text-2xl mb-10"
          style={{ color: 'var(--color-primary)' }}>
          Rent a <span style={{ color: 'var(--color-accent)' }} className="italic">Tutor</span>
        </Link>

        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
          style={{ backgroundColor: 'var(--color-surface)' }}>
          🕐
        </div>

        <h1 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-primary)' }}>
          Verification in progress
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          We've received your documents and are reviewing your application.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          You'll receive an email once your account has been approved, usually within 1–2 business days.
        </p>

        <div className="rounded-2xl p-6 text-left mb-8" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="space-y-4">
            {[
              { n: '1', text: 'Documents submitted ✓',         done: true  },
              { n: '2', text: 'Identity verification review',  done: false },
              { n: '3', text: 'Account approved',              done: false },
              { n: '4', text: 'Start uploading lessons',       done: false },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{
                    backgroundColor: s.done ? 'var(--color-primary)' : 'transparent',
                    color: s.done ? 'var(--color-nav-text)' : 'var(--color-primary)',
                    border: s.done ? 'none' : '1.5px solid var(--color-primary)',
                  }}>
                  {s.done ? '✓' : s.n}
                </div>
                <span className={`text-sm ${s.done ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                  {s.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-5">
          Questions? Email us at <span className="underline">hello@rentatutor.co.zm</span>
        </p>

        <Link href="/"
          className="text-sm px-6 py-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 inline-block">
          Back to home
        </Link>
      </div>
    </div>
  )
}
