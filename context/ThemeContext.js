// context/ThemeContext.js
'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const ThemeContext = createContext({ role: 'student', darkMode: false, toggleDark: () => {} })

function getSystemDark() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readDarkPref() {
  if (typeof document === 'undefined') return false
  try {
    const saved = localStorage.getItem('rat-dark')
    if (saved === 'dark') return true
    if (saved === 'light') return false
  } catch {}
  // No saved preference — check current data-dark attribute
  const attr = document.documentElement.getAttribute('data-dark')
  if (attr === 'true') return true
  if (attr === 'auto') return getSystemDark()
  return false
}

function applyDarkToDOM(isDark) {
  document.documentElement.setAttribute('data-dark', isDark ? 'true' : 'false')
  try { localStorage.setItem('rat-dark', isDark ? 'dark' : 'light') } catch {}
}

export function ThemeProvider({ children }) {
  const [role, setRole] = useState('student')
  const [darkMode, setDarkMode] = useState(false)

  const toggleDark = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev
      applyDarkToDOM(next)
      return next
    })
  }, [])

  function applyRole(r) {
    const validRole = ['student', 'tutor', 'admin'].includes(r) ? r : 'student'
    setRole(validRole)
    const theme = validRole === 'tutor' ? 'tutor' : 'student'
    document.documentElement.setAttribute('data-theme', theme)

    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `rat-role=${validRole}; path=/; max-age=604800; SameSite=Lax${secureFlag}`
  }

  useEffect(() => {
    // Sync dark mode state from DOM (already set by init script)
    setDarkMode(readDarkPref())

    // Listen for system preference changes when no explicit preference is saved
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function onSystemChange(e) {
      const saved = localStorage.getItem('rat-dark')
      if (!saved) {
        setDarkMode(e.matches)
        applyDarkToDOM(e.matches)
      }
    }
    mq.addEventListener('change', onSystemChange)

    // Role setup
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return applyRole('student')
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      applyRole(profile?.role ?? user.user_metadata?.role ?? 'student')
    }).catch(err => {
      console.error('[ThemeContext] auth error:', err)
      applyRole('student')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
        document.cookie = `rat-role=; path=/; max-age=0; SameSite=Lax${secureFlag}`
        return applyRole('student')
      }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single()
      applyRole(profile?.role ?? session.user.user_metadata?.role ?? 'student')
    })

    return () => {
      subscription.unsubscribe()
      mq.removeEventListener('change', onSystemChange)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ role, darkMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
