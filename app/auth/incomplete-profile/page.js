import Link from 'next/link'

export const metadata = {
  title: 'Account setup — Rent a Tutor',
}

export default function IncompleteProfilePage() {
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
          ⚠️
        </div>

        <h1 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-primary)' }}>
          Account setup incomplete
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          There was a problem setting up your account profile. Please sign out and register again, or contact us if the issue persists.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/register"
            className="text-sm px-6 py-2.5 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
            Register again
          </Link>
          <Link href="/contact"
            className="text-sm px-6 py-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            Contact support
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Already have an account?{' '}
          <Link href="/auth/login" className="underline" style={{ color: 'var(--color-primary-lit)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
