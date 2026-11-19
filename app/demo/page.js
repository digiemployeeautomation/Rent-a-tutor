'use client'
// One-click demo: creates a throw-away student account, signs in, and opens
// the dashboard. No forms for the visitor.
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Brand from '@/components/layout/Brand'
import SubjectArt from '@/components/art/SubjectArt'

// Shared across effect re-runs (React strict mode mounts twice in dev), so
// only one demo account is ever created per attempt.
let inflight = null

async function startDemo() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return

  let res
  try {
    res = await fetch('/api/demo/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
  } catch {
    throw new Error('We could not reach the server. Check your internet connection and try again.')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.email || !body.password) {
    throw new Error(body.error || 'The demo could not be started just now.')
  }

  const { error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password })
  if (error) throw new Error(error.message)
}

function runOnce() {
  if (!inflight) inflight = startDemo().finally(() => { inflight = null })
  return inflight
}

const TRY = [
  { art: 'quiz', tone: 'board', text: 'High School lessons with quick checks and quizzes' },
  { art: 'reading', tone: 'copper', text: 'IELTS practice with instant band-score feedback' },
  { art: 'offline', tone: 'board', text: 'Saving lessons to use offline' },
]

export default function DemoPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const go = useCallback(() => {
    setError('')
    runOnce()
      .then(() => {
        router.replace('/dashboard/student')
        router.refresh()
      })
      .catch((err) => setError(err?.message || 'Something went wrong.'))
  }, [router])

  useEffect(() => { go() }, [go])

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex h-[60px] shrink-0 items-center px-5 sm:px-8 lg:px-10">
        <Brand />
      </header>

      <main className="flex flex-1 items-start px-5 pb-20 pt-10 sm:items-center sm:px-8 sm:pt-0">
        <div className="mx-auto w-full max-w-[460px] animate-fade-in-up">
          {error ? (
            <div role="alert">
              <h1 className="h-page">The demo did not start.</h1>
              <p className="mt-3 text-[17px] leading-[1.5] text-ink-600">{error}</p>
              <div className="mt-7 flex flex-col gap-3">
                <button type="button" onClick={go} className="btn-primary btn-lg w-full">
                  <RotateCcw className="h-5 w-5" aria-hidden="true" /> Try again
                </button>
                <Link href="/learn/high-school" className="btn-secondary btn-lg w-full">Browse lessons without an account</Link>
              </div>
              <p className="mt-7 border-t border-ink-200 pt-5 text-[15px] text-ink-600">
                Have an account? <Link href="/auth/login" className="link">Log in</Link>
              </p>
            </div>
          ) : (
            <div role="status" aria-live="polite">
              <h1 className="h-page text-balance">Setting up your demo account</h1>
              <p className="mt-3 text-[17px] leading-[1.5] text-ink-600">This takes a few seconds. You will not need to sign up.</p>

              <div className="mt-7 h-1 w-full overflow-hidden rounded-full bg-ink-200" aria-hidden="true">
                <div className="demo-bar h-full w-1/3 rounded-full bg-board-700" />
              </div>

              <p className="mt-12 text-sm font-bold text-ink-900">In the demo you can try</p>
              <ul className="mt-2 border-t border-ink-300">
                {TRY.map(({ art, tone, text }) => (
                  <li key={text} className="flex items-center gap-3.5 border-b border-ink-200 py-3 text-base text-ink-700">
                    <SubjectArt name={art} tone={tone} className="h-9 w-9" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .demo-bar { animation: demoBar 1.5s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
        @keyframes demoBar { 0% { transform: translateX(-100%) } 100% { transform: translateX(300%) } }
        @media (prefers-reduced-motion: reduce) { .demo-bar { animation: none; width: 100% } }
      `}</style>
    </div>
  )
}
