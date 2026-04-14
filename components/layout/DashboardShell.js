// components/layout/DashboardShell.js
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

const STUDENT_NAV = [
  { href: '/dashboard/student',                label: 'Dashboard',   icon: '⬡', exact: true },
  { href: '/learn',                            label: 'Learn',       icon: '📚' },
  { href: '/dashboard/student/leaderboard',    label: 'Leaderboard', icon: '🏆' },
  { href: '/dashboard/student/settings',       label: 'Settings',    icon: '⚙' },
]

// Short labels for the mobile bottom nav where space is tight
const SHORT_LABELS = {
  'Dashboard':   'Home',
  'Learn':       'Learn',
  'Leaderboard': 'Ranks',
  'Settings':    'Settings',
}

export default function DashboardShell({ children, role }) {
  const pathname = usePathname()
  const nav      = STUDENT_NAV

  function isActive(item) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      <div className="flex" style={{ minHeight: 'calc(100vh - 64px)' }}>

        {/* ── Desktop sidebar — hidden on mobile ─────────────────── */}
        <aside className="hidden lg:flex lg:flex-col"
          style={{
            width: 200,
            flexShrink: 0,
            backgroundColor: 'var(--color-page-bg)',
            borderRight: '1px solid rgba(0,0,0,0.06)',
            padding: '16px 8px',
            gap: 2,
            position: 'sticky',
            top: 64,
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}>
          {nav.map(item => {
            const active = isActive(item)
            return (
              <Link key={item.href} href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  textDecoration: 'none',
                  color: active ? 'var(--color-primary)' : '#6b7280',
                  backgroundColor: active ? 'var(--color-surface)' : 'transparent',
                  borderLeft: active ? '3px solid var(--color-primary-mid)' : '3px solid transparent',
                  transition: 'background 0.1s, color 0.1s',
                }}>
                <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </Link>
            )
          })}
        </aside>

        {/* ── Main content ──────────────────────────────────────────
            pb-20 on mobile leaves room for the bottom nav bar.
            lg:pb-0 removes it on desktop where the nav is a sidebar. */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav — hidden on desktop ──────────────────
          Uses safe-area-inset-bottom so content clears the iPhone
          home indicator on notched devices. */}
      <nav className="lg:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          backgroundColor: 'var(--color-page-bg)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div style={{ display: 'flex' }}>
          {nav.map(item => {
            const active = isActive(item)
            return (
              <Link key={item.href} href={item.href}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: '8px 4px',
                  minHeight: 56,
                  textDecoration: 'none',
                  color: active ? 'var(--color-primary)' : '#9ca3af',
                  position: 'relative',
                }}>
                {/* Active indicator bar at top of tab */}
                {active && (
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: 'var(--color-primary)',
                  }} />
                )}
                <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                <span style={{
                  fontSize: 9,
                  fontWeight: active ? 500 : 400,
                  letterSpacing: '0.01em',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}>
                  {SHORT_LABELS[item.label] ?? item.label.split(' ')[0]}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
