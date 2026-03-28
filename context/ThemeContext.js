'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ThemeContext = createContext({ role: 'student' })

export function ThemeProvider({ children }) {
  const [role, setRole] = useState('student')

  function applyRole(r) {
    const validRole = ['student', 'tutor', 'admin'].includes(r) ? r : 'student'
    setRole(validRole)
    // admin gets student theme on public pages — only student/tutor themes exist
    document.documentElement.setAttribute('data-theme', validRole === 'tutor' ? 'tutor' : 'student')
  }

  useEffect(() => {
    // getUser() is secure — verifies with Supabase server, unlike getSession()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return applyRole('student')

      // Read from profiles table for accuracy
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      applyRole(profile?.role ?? user.user_metadata?.role ?? 'student')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return applyRole('student')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

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
