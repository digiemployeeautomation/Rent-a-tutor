'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import IELTSQuestionnaire from '@/components/onboarding/IELTSQuestionnaire'

export default function OnboardingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.replace('/auth/login?redirectTo=/onboarding')
        return
      }
      setChecking(false)
    }
    check()
    return () => { cancelled = true }
  }, [router])

  async function handleSubmit(answers) {
    const res = await fetch('/api/onboarding/ielts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })

    if (!res.ok) {
      let message = 'Something went wrong. Please try again.'
      try {
        const body = await res.json()
        if (body?.error) message = body.error
      } catch {}
      throw new Error(message)
    }

    const body = await res.json()
    router.push(body.redirect || '/dashboard/student')
    router.refresh()
  }

  if (checking) {
    return (
      <div className="flex items-center gap-2.5 py-20 text-[15px] font-semibold text-ink-500" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading your account
      </div>
    )
  }

  return <IELTSQuestionnaire onSubmit={handleSubmit} />
}
