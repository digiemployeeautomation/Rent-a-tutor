'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ── Icons (inline SVG — no extra deps) ─────────────────── */
const Icon = ({ d, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  profile:  'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  history:  'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  earnings: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  upload:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  sessions: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  settings: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  help:     'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  sun:      'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 1 0 0 14A7 7 0 0 0 12 5z',
  moon:     'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  logout:   'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  public:   'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  topics:   'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
}

/* ── Dark mode helpers ──────────────────────────────────── */
function getSystemPref() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getCurrentMode() {
  if (typeof document === 'undefined') return 'light'
  const attr = document.documentElement.getAttribute('data-dark')
  if (attr === 'true') return 'dark'
  if (attr === 'false' || attr === null) return 'light'
  return getSystemPref()
}

function setDarkMode(mode) {
  document.documentElement.setAttribute('data-dark', mode === 'dark' ? 'true' : 'false')
  try {
    localStorage.setItem('rat-dark', mode)
  } catch (err) {
    console.warn('[ProfileDropdown] Could not persist dark mode:', err)
  }
}

/* ── Main component ─────────────────────────────────────── */
export default function ProfileDropdown({ user, profile, onLogout }) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [dark, setDark]       = useState(false)
  const containerRef          = useRef(null)
  const menuRef               = useRef(null)

  const role      = profile?.role ?? 'student'
  const fullName  = profile?.full_name ?? user?.user_metadata?.full_name ?? 'Account'
  const email     = user?.email ?? ''
  const avatarUrl = profile?.avatar_url ?? null
  const initials  = fullName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  /* Sync dark state on mount */
  useEffect(() => {
    setDark(getCurrentMode() === 'dark')
    try {
      const saved = localStorage.getItem('rat-dark')
      if (saved) setDark(saved === 'dark')
    } catch (err) {
      console.warn('[ProfileDropdown] Could not read dark mode pref:', err)
    }
  }, [])

  /* Close on outside click or Escape */
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggleDark() {
    const next = dark ? 'light' : 'dark'
    setDark(!dark)
    setDarkMode(next)
  }

  function handleLogout() {
    setOpen(false)
    onLogout?.()
  }

  /* ── Menu structure (role-aware) ─────────────────────── */
  const tutorItems = [
    { label: 'Edit Profile',        href: '/dashboard/tutor/profile',        icon: 'profile'  },
    { label: 'Earnings & Payouts',  href: '/dashboard/tutor',                icon: 'earnings' },
    { label: 'Sessions',            href: '/dashboard/tutor/sessions',       icon: 'sessions' },
    { label: 'Upload Lesson',       href: '/dashboard/tutor/upload',         icon: 'upload'   },
    { label: 'Topic Requests',      href: '/dashboard/tutor/topic-requests', icon: 'topics'   },
    { label: 'View Public Profile', href: `/tutor/${user?.id}`,              icon: 'public'   },
  ]

  const studentItems = [
    { label: 'Edit Profile',     href: '/dashboard/student',                icon: 'profile'  },
    { label: 'Purchase History', href: '/dashboard/student/purchases',      icon: 'history'  },
    { label: 'Sessions',         href: '/dashboard/student',                icon: 'sessions' },
    { label: 'Request a Topic',  href: '/dashboard/student/topic-requests', icon: 'topics'   },
  ]

  const mainItems = role === 'tutor' ? tutorItems : studentItems

  const bottomItems = [
    { label: 'Help & Support', href: '/contact', icon: 'help' },
    { label: 'Settings',       href: role === 'tutor' ? '/dashboard/tutor/profile' : '/dashboard/student', icon: 'settings' },
  ]

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* ── Trigger ───────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Profile menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 2px',
          borderRadius: 10,
          outline: 'none',
          transition: 'opacity 150ms ease',
        }}
      >
        {/* Avatar */}
        {avatarUrl ? (
          <div style={{
            width: 36, height: 36,
            borderRadius: '50%',
            overflow: 'hidden',
            border: open
              ? '2px solid var(--color-nav-accent)'
              : '2px solid rgba(255,255,255,0.20)',
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
            boxShadow: open ? '0 0 0 3px rgba(250,199,117,0.25)' : 'none',
            flexShrink: 0,
          }}>
            <Image src={avatarUrl} alt={fullName} width={36} height={36}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          </div>
        ) : (
          <div style={{
            width: 36, height: 36,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600,
            letterSpacing: '0.05em',
            backgroundColor: 'var(--color-primary-mid)',
            color: '#fff',
            border: open
              ? '2px solid var(--color-nav-accent)'
              : '2px solid rgba(255,255,255,0.15)',
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
            boxShadow: open ? '0 0 0 3px rgba(250,199,117,0.25)' : 'none',
            flexShrink: 0,
          }}>
            {initials}
          </div>
        )}

        {/* Name + role (hidden on mobile) */}
        <div className="hidden sm:block" style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
            {fullName.split(' ')[0]}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize', lineHeight: 1.3 }}>
            {role}
          </div>
        </div>

        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="rgba(255,255,255,0.5)"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="hidden sm:block"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Dropdown panel ────────────────────────────── */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Profile options"
          className="pd-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 240,
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            zIndex: 100,
            transformOrigin: 'top right',
          }}
        >
          {/* User info header */}
          <div className="pd-header" style={{ padding: '14px 16px 12px' }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-primary, #173404)',
              fontFamily: 'Georgia, serif',
              marginBottom: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {fullName}
            </div>
            <div style={{
              fontSize: 11,
              color: 'var(--color-primary-lit, #3b6d11)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {email}
            </div>
          </div>

          {/* Main nav items */}
          <div style={{ padding: '6px 0' }}>
            {mainItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="pd-item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span className="pd-icon">
                  <Icon d={ICONS[item.icon]} />
                </span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="pd-divider" />

          {/* Bottom items */}
          <div style={{ padding: '6px 0' }}>
            {bottomItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="pd-item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span className="pd-icon">
                  <Icon d={ICONS[item.icon]} />
                </span>
                {item.label}
              </Link>
            ))}

            {/* Dark mode toggle */}
            <button className="pd-item" role="menuitem" onClick={toggleDark} style={{ width: '100%' }}>
              <span className="pd-icon">
                <Icon d={dark ? ICONS.sun : ICONS.moon} />
              </span>
              <span style={{ flex: 1 }}>{dark ? 'Light mode' : 'Dark mode'}</span>
              {/* Toggle pill */}
              <span
                role="switch"
                aria-checked={dark}
                aria-label="Toggle dark mode"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: 34,
                  height: 19,
                  borderRadius: 99,
                  backgroundColor: dark ? 'var(--color-primary-mid, #27500a)' : '#d1d5db',
                  padding: '0 2px',
                  transition: 'background-color 250ms ease',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
                  transform: dark ? 'translateX(15px)' : 'translateX(0)',
                  transition: 'transform 250ms cubic-bezier(0.34,1.56,0.64,1)',
                  display: 'block',
                }} />
              </span>
            </button>
          </div>

          <div className="pd-divider" />

          {/* Log out */}
          <div style={{ padding: '6px 0 8px' }}>
            <button
              className="pd-item"
              role="menuitem"
              onClick={handleLogout}
              style={{ color: '#dc2626', width: '100%' }}
            >
              <span style={{ color: '#dc2626', flexShrink: 0 }}>
                <Icon d={ICONS.logout} />
              </span>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
