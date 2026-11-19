'use client'
// One-click demo: creates a throw-away student account, signs in, and opens
// the dashboard. No forms for the visitor.
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, CloudDownload, Languages, RotateCcw, TriangleAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Brand from '@/components/layout/Brand'

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
  { icon: BookOpen, text: 'High school lessons with quick checks and quizzes', tone: 'bg-blue-50 text-blue-600' },
  { icon: Languages, text: 'IELTS practice with instant band-score feedback', tone: 'bg-teal-50 text-teal-600' },
  { icon: CloudDownload, text: 'Saving lessons to use offline', tone: 'bg-sun-100 text-sun-600' },
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <Brand className="justify-center" />

        {error ? (
          <div className="card mt-10 p-6 text-left sm:p-8" role="alert">
            <span className="icon-tile bg-rose-50 text-rose-600"><TriangleAlert className="h-5 w-5" aria-hidden="true" /></span>
            <h1 className="h-page mt-5">The demo did not start</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{error}</p>
            <div className="mt-6 grid gap-3">
              <button type="button" onClick={go} className="btn-primary btn-lg w-full">
                <RotateCcw className="h-5 w-5" aria-hidden="true" /> Try again
              </button>
              <Link href="/learn/high-school" className="btn-secondary w-full">Browse lessons without an account</Link>
            </div>
            <p className="mt-5 text-center text-sm text-ink-500">
              Have an account? <Link href="/auth/login" className="font-semibold text-blue-700 hover:underline">Log in</Link>
            </p>
          </div>
        ) : (
          <div className="mt-10" role="status" aria-live="polite">
            <div className="mx-auto h-1.5 w-40 overflow-hidden rounded-full bg-ink-100">
              <div className="demo-bar h-full w-1/3 rounded-full bg-blue-600" />
            </div>
            <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink-900">Setting up your demo account…</h1>
            <p className="mt-2 text-[15px] text-ink-500">This takes a few seconds. You will not need to sign up.</p>

            <div className="card mt-8 p-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">In the demo you can try</p>
              <ul className="mt-4 space-y-3">
                {TRY.map(({ icon: Icon, text, tone }) => (
                  <li key={text} className="flex items-center gap-3 text-[15px] text-ink-700">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .demo-bar { animation: demoBar 1.4s ease-in-out infinite; }
        @keyframes demoBar { 0% { transform: translateX(-100%) } 100% { transform: translateX(300%) } }
        @media (prefers-reduced-motion: reduce) { .demo-bar { animation: none; width: 100% } }
      `}</style>
    </div>
  )
}
