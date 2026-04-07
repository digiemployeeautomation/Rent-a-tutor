// context/ThemeContext.js
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ThemeContext = createContext({ role: 'student' })

export function ThemeProvider({ children }) {
  const [role, setRole] = useState('student')

  function applyRole(r) {
    const validRole = ['student', 'tutor', 'admin'].includes(r) ? r : 'student'
    setRole(validRole)
    const theme = validRole === 'tutor' ? 'tutor' : 'student'
    document.documentElement.setAttribute('data-theme', theme)

    // Add Secure flag when served over HTTPS (i.e. in production).
    // Localhost skips it so local dev still works.
    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `rat-role=${validRole}; path=/; max-age=604800; SameSite=Lax${secureFlag}`
  }

  useEffect(() => {
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

    return () => subscription.unsubscribe()
  }, [])

  return (
    <ThemeContext.Provider value={{ role }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
