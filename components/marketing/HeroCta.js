'use client'
// Hero call to action. Visitors get the one-click demo; signed-in students
// get a shortcut back to their dashboard.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Play } from 'lucide-react'
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
        <Link href="/dashboard/student" className="btn-accent btn-lg">
          Go to my dashboard <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      ) : (
        <Link href="/demo" className="btn-accent btn-lg">
          <Play className="h-5 w-5 fill-current" aria-hidden="true" /> Try the live demo
        </Link>
      )}
      <Link
        href="/learn/high-school"
        className="btn btn-lg border border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
      >
        Browse lessons
      </Link>
    </div>
  )
}
