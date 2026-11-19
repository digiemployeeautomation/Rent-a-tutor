// Footer for public marketing pages (landing, about, contact).
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
    <footer className="no-print border-t border-ink-100 bg-white">
      <div className="container-app grid grid-cols-2 gap-x-6 gap-y-8 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="col-span-2 sm:col-span-1">
          <Brand />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
            Free step-by-step lessons for Zambian high-school subjects and IELTS preparation. Lessons work offline.
          </p>
        </div>
        {GROUPS.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">{g.title}</p>
            <ul className="mt-3 space-y-1">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-[36px] items-center text-[15px] text-ink-600 hover:text-blue-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-ink-100">
        <div className="container-app py-5 text-sm text-ink-400">© 2026 Rent a Tutor</div>
      </div>
    </footer>
  )
}
