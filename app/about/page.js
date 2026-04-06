// app/about/page.js
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export const metadata = {
  title: 'About — Rent a Tutor',
}

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Hero */}
      <div className="px-6 py-16 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <h1 className="font-serif text-4xl mb-4" style={{ color: 'var(--color-surface-mid)' }}>
          About Rent a Tutor
        </h1>
        <p className="text-base opacity-80 max-w-xl mx-auto" style={{ color: 'var(--color-surface-mid)' }}>
          Zambia's online tutoring platform — built to help O-Level and A-Level students access quality education from anywhere in the country.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14 space-y-12">

        {/* Mission */}
        <section>
          <h2 className="font-serif text-2xl mb-4" style={{ color: 'var(--color-primary)' }}>Our mission</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Every student in Zambia deserves access to a great tutor, regardless of where they live or how much money their family has. Rent a Tutor makes this possible by connecting students with qualified tutors online — through recorded lessons they can watch at any time, or live private sessions booked directly.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We built the platform specifically around the ECZ curriculum for Forms 1–6, so every lesson is relevant to what students are actually studying.
          </p>
        </section>

        {/* How it works */}
        <section>
          <h2 className="font-serif text-2xl mb-6" style={{ color: 'var(--color-primary)' }}>How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'For students',
                items: [
                  'Browse lessons by subject and form level',
                  'Buy individual lessons via Airtel or MTN Money',
                  'Watch at your own pace, as many times as you need',
                  'Book live 1-on-1 sessions with verified tutors',
                ],
              },
              {
                title: 'For tutors',
                items: [
                  'Upload recorded lessons and earn 70% of every sale',
                  'Accept private session bookings from students',
                  'Get a public profile and build your reputation',
                  'Receive payouts directly to your mobile money',
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

        {/* Curriculum */}
        <section>
          <h2 className="font-serif text-2xl mb-4" style={{ color: 'var(--color-primary)' }}>Curriculum coverage</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            All lessons are mapped to the Examinations Council of Zambia (ECZ) syllabus. We cover both O-Level (Forms 1–4) and A-Level (Forms 5–6), with a focus on the core subjects students need to pass their school certificate exams.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics',
              'Geography', 'History', 'Commerce', 'Principles of Accounts', 'Economics',
              'Computer Studies', 'Additional Mathematics', 'Further Mathematics',
            ].map(s => (
              <span key={s} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600">
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
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
            <Link href="/browse"
              className="text-sm px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
              Browse lessons
            </Link>
          </div>
        </section>
      </div>

      {/* Footer — stacks on mobile */}
      <footer className="bg-white border-t border-gray-200 px-6 py-5 text-sm text-gray-400">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <span className="font-serif" style={{ color: 'var(--color-primary-lit)' }}>Rent a Tutor · Zambia</span>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link href="/browse" className="hover:text-gray-600">Browse lessons</Link>
            <Link href="/tutor" className="hover:text-gray-600">Find a tutor</Link>
            <Link href="/contact" className="hover:text-gray-600">Contact</Link>
          </div>
          <span>© 2026 Rent a Tutor</span>
        </div>
      </footer>
    </div>
  )
}
