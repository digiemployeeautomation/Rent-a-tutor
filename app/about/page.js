// app/about/page.js
import Link from 'next/link'

export const metadata = {
  title: 'About — Rent a Tutor',
}

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <div className="px-6 py-16 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <h1 className="font-serif text-4xl mb-4" style={{ color: 'var(--color-surface-mid)' }}>
          About Rent a Tutor
        </h1>
        <p className="text-base opacity-80 max-w-xl mx-auto" style={{ color: 'var(--color-surface-mid)' }}>
          A fully-automated IELTS preparation platform — instant band-score feedback on Writing and Speaking, full coverage of all four sections.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14 space-y-12">

        <section>
          <h2 className="font-serif text-2xl mb-4" style={{ color: 'var(--color-primary)' }}>Our mission</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Most IELTS prep tools either grade your Writing and Speaking on a delay (and charge for it) or skip those sections entirely. We use AI graders calibrated against certified IELTS examiners so you can practice as often as you need and see your estimated band rise in real time.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We support both Academic and General Training, and every prompt is band-targeted so the practice matches your level.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-6" style={{ color: 'var(--color-primary)' }}>How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Listening & Reading',
                items: [
                  'Authentic-style passages and audio',
                  'Every IELTS question type covered',
                  'Instant scoring against the official band conversion',
                  'Difficulty matched to your current band',
                ],
              },
              {
                title: 'Writing & Speaking',
                items: [
                  'AI-graded Task 1 & Task 2 in under a minute',
                  'Per-criterion feedback: Task Response, Coherence, Lexical, Grammar',
                  'Inline corrections and a model rewrite',
                  'Record your Speaking response and get fluency feedback',
                ],
              },
            ].map(col => (
              <div key={col.title}
                className="rounded-2xl p-5"
                style={{ backgroundColor: 'var(--color-surface)' }}>
                <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--color-primary)' }}>
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary-lit)' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4" style={{ color: 'var(--color-primary)' }}>Calibration</h2>
          <p className="text-gray-600 leading-relaxed">
            Estimated band scores are calibrated against a set of writing and speaking responses pre-scored by certified IELTS examiners. We re-run the calibration every time the underlying AI model changes. Your estimated band is exactly that — an estimate. Official IELTS scores can only be issued by Cambridge, IDP, or the British Council.
          </p>
        </section>

        <section className="text-center pt-4">
          <h2 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-primary)' }}>
            Ready to get started?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register"
              className="text-sm px-6 py-2.5 rounded-lg font-medium"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              Create a free account
            </Link>
            <Link href="/contact"
              className="text-sm px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
              Get in touch
            </Link>
          </div>
        </section>
      </div>

      <footer className="bg-white border-t border-gray-200 px-6 py-5 text-sm text-gray-400">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <span className="font-serif" style={{ color: 'var(--color-primary-lit)' }}>Rent a Tutor</span>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link href="/auth/register" className="hover:text-gray-600">Sign up</Link>
            <Link href="/auth/login" className="hover:text-gray-600">Sign in</Link>
            <Link href="/contact" className="hover:text-gray-600">Contact</Link>
          </div>
          <span>© 2026 Rent a Tutor</span>
        </div>
      </footer>
    </div>
  )
}
