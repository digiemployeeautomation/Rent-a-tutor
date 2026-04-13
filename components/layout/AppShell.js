// components/layout/AppShell.js
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'
import {
  Home, BookOpen, Upload, Calendar, MessageSquare,
  User, ShoppingBag, Search, Users,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'

const TUTOR_NAV = [
  { href: '/dashboard/tutor',                label: 'Dashboard',      icon: Home,           exact: true },
  { href: '/dashboard/tutor/lessons',        label: 'My Lessons',     icon: BookOpen        },
  { href: '/dashboard/tutor/upload',         label: 'Upload Lesson',  icon: Upload          },
  { href: '/dashboard/tutor/sessions',       label: 'Sessions',       icon: Calendar        },
  { href: '/dashboard/tutor/topic-requests', label: 'Topic Requests', icon: MessageSquare   },
  { href: '/dashboard/tutor/profile',        label: 'My Profile',     icon: User            },
]

const STUDENT_NAV = [
  { href: '/dashboard/student',                label: 'Dashboard',      icon: Home,           exact: true },
  { href: '/dashboard/student/purchases',      label: 'My Purchases',   icon: ShoppingBag     },
  { href: '/browse',                           label: 'Browse Lessons', icon: Search,         external: true },
  { href: '/tutor',                            label: 'Find a Tutor',   icon: Users,          external: true },
  { href: '/dashboard/student/topic-requests', label: 'Request a Topic', icon: MessageSquare  },
]

function readCollapsed() {
  try { return localStorage.getItem('rat-sidebar') === 'collapsed' } catch { return false }
}

export default function AppShell({ children }) {
  const { role } = useTheme()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Hydrate collapsed state from localStorage after mount
  useEffect(() => { setCollapsed(readCollapsed()) }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  function toggleCollapse() {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('rat-sidebar', next ? 'collapsed' : 'expanded') } catch {}
      return next
    })
  }

  const nav = role === 'tutor' ? TUTOR_NAV : STUDENT_NAV

  function isActive(item) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  // Don't show sidebar if not signed in or auth not ready
  if (!authReady || !user) return children

  const sidebarWidth = collapsed ? 56 : 200

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>

      {/* ── Desktop sidebar — hidden on mobile ── */}
      <aside
        className="hidden lg:flex lg:flex-col"
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          backgroundColor: 'var(--color-page-bg)',
          borderRight: '1px solid rgba(0,0,0,0.06)',
          padding: collapsed ? '16px 4px' : '16px 8px',
          gap: 2,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'width 200ms ease, padding 200ms ease',
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            padding: '6px 10px',
            marginBottom: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            borderRadius: 10,
            transition: 'color 150ms',
          }}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Nav items */}
        {nav.map(item => {
          const active = isActive(item)
          const IconComp = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={active ? '' : 'sidebar-link'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '8px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 14,
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                textDecoration: 'none',
                color: active ? 'var(--color-primary)' : '#6b7280',
                backgroundColor: active ? 'var(--color-surface)' : 'transparent',
                borderLeft: collapsed
                  ? 'none'
                  : active
                    ? '3px solid var(--color-primary-mid)'
                    : '3px solid transparent',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                transition: 'background-color 150ms, padding 200ms ease',
              }}
            >
              <IconComp
                size={18}
                style={{ flexShrink: 0 }}
              />
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.external && (
                    <span style={{ fontSize: 10, color: '#d1d5db' }}>&#8599;</span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </aside>

      {/* ── Main content ── */}
      <div
        className="flex-1 min-w-0"
        style={{
          marginLeft: undefined, // mobile: no margin
          transition: 'margin-left 200ms ease',
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            [data-main-content] {
              margin-left: ${sidebarWidth}px !important;
              transition: margin-left 200ms ease;
            }
          }
        `}</style>
        <div data-main-content="">
          {children}
        </div>
      </div>
    </div>
  )
}
