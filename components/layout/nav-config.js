import { Home, GraduationCap, Languages, Download } from 'lucide-react'

// One source of truth for the signed-in navigation (desktop bar + mobile tabs).
export const APP_NAV = [
  { href: '/dashboard/student', label: 'Home', icon: Home, match: ['/dashboard'] },
  { href: '/learn/high-school', label: 'High School', icon: GraduationCap, match: ['/learn/high-school'] },
  { href: '/practice', label: 'IELTS', icon: Languages, match: ['/practice', '/learn/reading'] },
  { href: '/downloads', label: 'Downloads', icon: Download, match: ['/downloads'] },
]

export const PUBLIC_NAV = [
  { href: '/learn/high-school', label: 'High School', match: ['/learn/high-school'] },
  { href: '/#ielts', label: 'IELTS', match: [] },
  { href: '/#offline', label: 'Offline lessons', match: [] },
  { href: '/about', label: 'About', match: ['/about'] },
]

export function isActive(pathname, item) {
  return item.match.some((m) => pathname === m || pathname.startsWith(m + '/') || pathname === item.href)
}
