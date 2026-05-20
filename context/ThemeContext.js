// context/ThemeContext.js
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ThemeContext = createContext({ role: 'student' })

// Role is sourced from auth user_metadata only. The old `profiles` table
// lookup was removed when we pivoted to IELTS — new users have no row
// there, and the .single() query was returning 406 on every page load.
function roleFromUser(user) {
  if (!user) return 'student'
  const meta = user.user_metadata?.role
  return meta === 'admin' || meta === 'student' ? meta : 'student'
}

export function ThemeProvider({ children }) {
  const [role, setRole] = useState('student')

  function applyRole(r) {
    setRole(r)
    document.documentElement.setAttribute('data-theme', 'student')
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      applyRole(roleFromUser(user))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyRole(roleFromUser(session?.user))
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
