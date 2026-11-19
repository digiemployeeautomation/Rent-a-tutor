'use client'
// components/offline/TopicDownload.js
//
// Small button in a topic header: saves every lesson of the topic to the
// device in one go.  idle -> "Saving 2 of 3…" -> "3 lessons saved".
//
// Props: subject (slug), topicSlug, topic (display name), count (lessons in the topic)
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, Download, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { listSaved, saveLessons, subscribe } from '@/lib/offline/store'
import { ensureOfflineShell } from '@/lib/offline/sw-client'

export default function TopicDownload({ subject, topicSlug, topic, count = 0 }) {
  const toast = useToast()
  const [savedCount, setSavedCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: count })

  useEffect(() => {
    let alive = true
    const check = () => listSaved()
      .then((records) => {
        if (alive) setSavedCount(records.filter((r) => r.course === 'highschool' && r.subject === subject && r.topicSlug === topicSlug).length)
      })
      .catch(() => {})
    check()
    const unsubscribe = subscribe(check)
    return () => { alive = false; unsubscribe() }
  }, [subject, topicSlug])

  async function saveTopic() {
    if (saving) return
    setSaving(true)
    setProgress({ done: 0, total: count })
    try {
      const res = await fetch(`/api/hs/lessons?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topicSlug)}`)
      if (!res.ok) throw new Error('bad response')
      const { lessons } = await res.json()
      if (!Array.isArray(lessons) || lessons.length === 0) throw new Error('no lessons')
      setProgress({ done: 0, total: lessons.length })
      const done = await saveLessons(lessons, (d, t) => setProgress({ done: d, total: t }))
      setSavedCount(done)
      const shell = await ensureOfflineShell({ timeoutMs: 20000 })
      const what = `${done} ${topic || 'topic'} ${done === 1 ? 'lesson' : 'lessons'}`
      if (shell.ok) toast.success(`${what} saved. Open them from Downloads without internet.`)
      else toast.info(`${what} saved on this device. Open Downloads once while you are online to finish setting up offline use.`)
    } catch (err) {
      if (err?.name === 'OfflineStorageError') toast.error(err.message)
      else if (typeof navigator !== 'undefined' && !navigator.onLine) toast.error('You are offline. Connect to the internet to save this topic.')
      else toast.error('This topic could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (saving) {
    return (
      <button type="button" className="btn-secondary btn-sm" disabled aria-live="polite">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Saving {Math.min(progress.done + 1, progress.total || 1)} of {progress.total || count}…
      </button>
    )
  }

  if (count > 0 && savedCount >= count) {
    return (
      <Link
        href="/downloads"
        title="Open your Downloads"
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {savedCount} {savedCount === 1 ? 'lesson' : 'lessons'} saved
      </Link>
    )
  }

  return (
    <button type="button" className="btn-secondary btn-sm" onClick={saveTopic}>
      <Download className="h-4 w-4" aria-hidden="true" /> Save topic offline
    </button>
  )
}
