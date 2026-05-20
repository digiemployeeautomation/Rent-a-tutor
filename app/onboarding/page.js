'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
        router.replace('/auth/signin?next=/onboarding')
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
  }

  if (checking) {
    return (
      <div className="flex justify-center py-20 text-gray-400">Loading…</div>
    )
  }

  return <IELTSQuestionnaire onSubmit={handleSubmit} />
}
