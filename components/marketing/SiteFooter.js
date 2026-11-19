// Footer for public marketing pages (landing, about, contact). Quiet and ruled.
import Link from 'next/link'
import Brand from '@/components/layout/Brand'

const GROUPS = [
  {
    title: 'Learn',
    links: [
      { href: '/learn/high-school', label: 'High School' },
      { href: '/#ielts', label: 'IELTS' },
      { href: '/downloads', label: 'Downloads' },
    ],
  },
  {
    title: 'Rent a Tutor',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/auth/login', label: 'Log in' },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="no-print mt-20 sm:mt-28">
      <div className="container-app">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-t-2 border-ink-900 pb-10 pt-8 sm:grid-cols-[1.6fr_1fr_1fr]">
          <div className="col-span-2 sm:col-span-1">
            <Brand />
            <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-ink-600">
              Free step-by-step lessons for Zambian high-school subjects and IELTS preparation. Lessons work offline.
            </p>
          </div>
          {GROUPS.map((g) => (
            <nav key={g.title} aria-label={g.title}>
              <p className="text-sm font-bold text-ink-900">{g.title}</p>
              <ul className="mt-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-[40px] items-center text-[15px] font-semibold text-ink-600 decoration-ink-900 underline-offset-4 hover:text-ink-900 hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="border-t border-ink-200 py-5 text-[13px] font-semibold text-ink-500">
          © 2026 Rent a Tutor · Completely free, no payments
        </p>
      </div>
    </footer>
  )
}
