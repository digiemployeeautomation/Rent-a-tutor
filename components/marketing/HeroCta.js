'use client'
// Hero call to action. Visitors get the one-click demo; signed-in students
// get a shortcut back to their dashboard.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function HeroCta() {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data?.session)))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session))
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {signedIn ? (
        <Link href="/dashboard/student" className="btn-primary btn-lg group">
          Go to my dashboard <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
        </Link>
      ) : (
        <Link href="/demo" className="btn-primary btn-lg group">
          Try the demo <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
        </Link>
      )}
      <Link href="/learn/high-school" className="btn-secondary btn-lg">Browse lessons</Link>
    </div>
  )
}
