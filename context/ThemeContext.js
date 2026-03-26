'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ThemeContext = createContext({ role: 'student' })

export function ThemeProvider({ children }) {
  const [role, setRole] = useState('student')

  useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userRole = session?.user?.user_metadata?.role || 'student'
      setRole(userRole)
      document.documentElement.setAttribute('data-theme', userRole)
    })

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const userRole = session?.user?.user_metadata?.role || 'student'
      setRole(userRole)
      document.documentElement.setAttribute('data-theme', userRole)
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
