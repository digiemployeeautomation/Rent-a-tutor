// context/ThemeContext.js
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ThemeContext = createContext({ role: 'student' })

export function ThemeProvider({ children }) {
  const [role, setRole] = useState('student')

  function applyRole(r) {
    const validRole = ['student', 'admin'].includes(r) ? r : 'student'
    setRole(validRole)
    // Always use the student theme
    document.documentElement.setAttribute('data-theme', 'student')
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return applyRole('student')
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      applyRole(profile?.role ?? user.user_metadata?.role ?? 'student')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
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
