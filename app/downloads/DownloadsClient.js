'use client'
// app/downloads/DownloadsClient.js
//
// The offline library and the offline lesson player, in one client component.
//   /downloads               -> list of saved lessons
//   /downloads?lesson=<id>   -> plays that saved lesson with LessonPlayer
// Nothing here needs the network: lessons come from lib/offline/store.js
// (IndexedDB) and quiz results from localStorage.
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock, CloudOff, DownloadCloud, HardDrive,
  Languages, Loader2, Share, Smartphone, Trash2, Wifi, WifiOff,
} from 'lucide-react'
import LessonPlayer from '@/components/lesson/LessonPlayer'
import LessonDownload from '@/components/offline/LessonDownload'
import SubjectIcon from '@/components/highschool/SubjectIcon'
import { useToast } from '@/components/ui/toast'
import { subjectMeta } from '@/lib/highschool/subjects'
import { loadProgress } from '@/lib/highschool/progress-client'
import { formatBytes, getSavedLesson, groupSaved, listSaved, prettySlug, removeLesson, subscribe } from '@/lib/offline/store'
import { checkOnline, ensureOfflineShell, isOfflineShellCached, swSupported } from '@/lib/offline/sw-client'

// Same key as lib/highschool/progress-client.js — read directly so the list
// never waits for the network.
const PROGRESS_KEY = 'rat.hs.progress.v1'

function readLocalProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') || {} } catch { return {} }
}

function savedDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

function lessonUrl(id) {
  return `/downloads?lesson=${encodeURIComponent(id)}`
}

export function DownloadsSkeleton() {
  return (
    <div className="container-app py-6 sm:py-10" aria-busy="true" aria-label="Loading your downloads">
      <div className="h-3 w-28 animate-pulse rounded bg-ink-100" />
      <div className="mt-3 h-8 w-48 animate-pulse rounded-lg bg-ink-100" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-ink-100" />
      <div className="mt-8 space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-white shadow-card" />
        <div className="h-24 animate-pulse rounded-2xl bg-white shadow-card" />
      </div>
    </div>
  )
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function StatusRow({ online, records, shell }) {
  const bytes = records.reduce((n, r) => n + (r.bytes || 0), 0)
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2" aria-live="polite">
      {online ? (
        <span className="chip-green"><Wifi className="h-3.5 w-3.5" aria-hidden="true" /> Online</span>
      ) : (
        <span className="chip-sun"><WifiOff className="h-3.5 w-3.5" aria-hidden="true" /> Offline — saved lessons still work</span>
      )}
      <span className="chip">
        <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
        {records.length === 0
          ? 'Nothing saved yet'
          : `${records.length} ${records.length === 1 ? 'lesson' : 'lessons'} · about ${formatBytes(bytes)} on this device`}
      </span>
      {shell === 'ready' ? (
        <span className="chip-green"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Ready to use offline</span>
      ) : shell === 'working' ? (
        <span className="chip"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Getting ready for offline…</span>
      ) : shell === 'pending' ? (
        <span className="chip-sun"><CloudOff className="h-3.5 w-3.5" aria-hidden="true" /> Offline setup not finished — open this page once with internet</span>
      ) : null}
    </div>
  )
}

function InstallHint() {
  const [prompt, setPrompt] = useState(null)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    const sync = () => setPrompt(window.__ratInstallPrompt || null)
    sync()
    window.addEventListener('rat:installable', sync)
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
    setIos(!standalone && /iphone|ipad|ipod/i.test(window.navigator.userAgent))
    return () => window.removeEventListener('rat:installable', sync)
  }, [])

  async function install() {
    if (!prompt) return
    try {
      prompt.prompt()
      await prompt.userChoice
    } catch {}
    window.__ratInstallPrompt = null
    setPrompt(null)
  }

  if (prompt) {
    return (
      <div className="card mt-8 flex items-center gap-3.5 p-4 sm:p-5">
        <span className="icon-tile bg-ink-900 text-white"><Smartphone className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink-900">Install the app</p>
          <p className="mt-0.5 text-sm leading-snug text-ink-500">Open your saved lessons from your home screen with one tap.</p>
        </div>
        <button type="button" className="btn-dark shrink-0" onClick={install}>Install</button>
      </div>
    )
  }
  if (ios) {
    return (
      <p className="mt-8 flex items-start gap-2 text-sm text-ink-500">
        <Share className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
        On iPhone or iPad: tap Share, then “Add to Home Screen” to keep Rent a Tutor one tap away.
      </p>
    )
  }
  return null
}

function EmptyState({ online }) {
  const steps = [
    { title: 'Open a lesson', text: 'While you have internet, open any lesson you want to keep.' },
    { title: 'Tap “Save for offline”', text: 'The whole lesson — diagrams and quiz too — is kept on this device.' },
    { title: 'Study with no data', text: 'Come back to Downloads any time. Saved lessons open without internet.' },
  ]
  return (
    <div className="card mt-8 p-6 text-center sm:p-10">
      <span className="icon-tile mx-auto h-14 w-14 rounded-2xl bg-blue-50 text-blue-700"><DownloadCloud className="h-7 w-7" aria-hidden="true" /></span>
      <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">No lessons saved yet</h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-500">
        Save lessons when you have internet, then study anywhere — on the bus, at home, or when your data runs out.
      </p>
      <ol className="mt-7 grid gap-3 text-left sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3.5 rounded-2xl bg-ink-50 p-4 sm:flex-col sm:gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span>
            <span>
              <span className="block text-[15px] font-semibold text-ink-900">{s.title}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-ink-500">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      {online ? (
        <Link href="/learn/high-school" className="btn-primary btn-lg mt-7 w-full sm:w-auto">
          Browse high-school lessons <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      ) : (
        <p className="mx-auto mt-7 max-w-sm rounded-xl bg-sun-50 px-4 py-3 text-sm text-ink-700">
          You are offline right now. Connect to the internet to save your first lesson.
        </p>
      )}
    </div>
  )
}

function LessonRow({ record, index, result, onOpen, onRemove }) {
  const [confirm, setConfirm] = useState(false)
  const passed = !!result?.passed

  useEffect(() => {
    if (!confirm) return undefined
    const t = setTimeout(() => setConfirm(false), 4000)
    return () => clearTimeout(t)
  }, [confirm])

  return (
    <li className="flex items-start gap-1 pr-2 sm:items-center sm:pr-3">
      <a
        href={lessonUrl(record.id)}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
          e.preventDefault()
          onOpen(record.id)
        }}
        className="group flex min-w-0 flex-1 items-start gap-3.5 py-4 pl-5 pr-2 transition-colors hover:bg-ink-50 focus:outline-none focus-visible:bg-blue-50 sm:items-center sm:pl-6"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${passed ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-500'}`}>
          {passed ? <Check className="h-5 w-5" aria-label="Passed" /> : index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold leading-snug text-ink-900">{record.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-medium text-ink-400">
            {record.minutes ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {record.minutes} min</span> : null}
            <span>Saved {savedDate(record.savedAt)}</span>
            {passed
              ? <span className="text-emerald-600">Passed · {result.score}/{result.total}</span>
              : result ? <span className="text-sun-600">Last try {result.score}/{result.total}</span> : null}
          </span>
          <span className="btn-primary btn-sm mt-3 group-hover:bg-blue-700 sm:hidden">Open <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
        </span>
        <span className="btn-primary btn-sm hidden shrink-0 group-hover:bg-blue-700 sm:inline-flex">Open</span>
      </a>
      {confirm ? (
        <button
          type="button"
          onClick={() => onRemove(record)}
          className="mt-2.5 min-h-[44px] shrink-0 rounded-xl bg-rose-50 px-3 text-[13px] font-semibold text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:mt-0"
        >
          Remove?
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          aria-label={`Remove ${record.title} from this device`}
          title="Remove from this device"
          className="mt-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:mt-0"
        >
          <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      )}
    </li>
  )
}

function Library({ records, progress, online, shell, onOpen, onRemove }) {
  const courses = useMemo(() => groupSaved(records), [records])
  return (
    <div className="container-app py-6 sm:py-10">
      <p className="eyebrow">Offline library</p>
      <h1 className="h-page mt-1.5">Downloads</h1>
      <p className="lead mt-2 max-w-2xl">Lessons saved on this device. They open without internet or data.</p>

      <StatusRow online={online} records={records} shell={shell} />

      {records.length === 0 ? <EmptyState online={online} /> : (
        <div className="mt-8 space-y-10">
          {courses.map((course) => (
            <section key={course.course} aria-label={course.name}>
              <div className="flex items-center gap-3">
                <h2 className="h-section">{course.name}</h2>
                <span className={course.chip}>
                  {course.groups.reduce((n, g) => n + g.records.length, 0)} saved
                </span>
              </div>
              <div className="mt-4 space-y-5">
                {course.groups.map((group) => {
                  const meta = subjectMeta(group.subject)
                  const isIelts = course.course === 'ielts'
                  const subjectName = meta?.name || prettySlug(group.subject) || course.name
                  const heading = group.topic || subjectName
                  const eyebrow = subjectName.toLowerCase() === heading.toLowerCase() ? course.name : subjectName
                  return (
                    <div key={group.key} className="card overflow-hidden">
                      <header className="flex items-center gap-3.5 border-b border-ink-100 px-5 py-4 sm:px-6">
                        <span className={`icon-tile ${meta?.tile || (isIelts ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700')}`}>
                          {meta ? <SubjectIcon name={meta.icon} /> : isIelts ? <Languages className="h-5 w-5" aria-hidden="true" /> : <BookOpen className="h-5 w-5" aria-hidden="true" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                            {eyebrow}
                            {group.form ? ` · Form ${group.form}${group.term ? ` · Term ${group.term}` : ''}` : ''}
                          </p>
                          <h3 className="mt-0.5 font-display text-[17px] font-semibold tracking-tight text-ink-900">{heading}</h3>
                        </div>
                      </header>
                      <ol className="divide-y divide-ink-100">
                        {group.records.map((r, i) => (
                          <LessonRow key={r.id} record={r} index={i} result={progress[r.id]} onOpen={onOpen} onRemove={onRemove} />
                        ))}
                      </ol>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
          {online ? (
            <p className="text-center text-sm text-ink-400">
              Want more? <Link href="/learn/high-school" className="font-semibold text-blue-700 underline-offset-2 hover:underline">Browse high-school lessons</Link> and save them here.
            </p>
          ) : null}
        </div>
      )}

      <InstallHint />
    </div>
  )
}

function NotSaved({ onBack }) {
  return (
    <div className="container-read py-12 text-center">
      <span className="icon-tile mx-auto h-14 w-14 rounded-2xl bg-sun-100 text-sun-600"><CloudOff className="h-7 w-7" aria-hidden="true" /></span>
      <h1 className="h-page mt-4">This lesson is not saved on this device</h1>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-500">
        It may have been removed, or saved in a different browser. Open the lesson online and tap “Save for offline” to keep it here.
      </p>
      <button type="button" className="btn-primary mt-6" onClick={onBack}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Downloads</button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DownloadsClient() {
  const toast = useToast()
  const searchParams = useSearchParams()
  const openId = searchParams.get('lesson')

  const [records, setRecords] = useState(null) // null = loading
  const [progress, setProgress] = useState({})
  const [online, setOnline] = useState(true)
  const [shell, setShell] = useState(null) // null | 'working' | 'ready' | 'pending'
  const [open, setOpen] = useState(null) // { id, record } | { id, missing: true }
  const openedFromList = useRef(false)

  const refresh = useCallback(() => listSaved().then(setRecords).catch(() => setRecords([])), [])

  useEffect(() => {
    refresh()
    return subscribe(refresh)
  }, [refresh])

  // Live connection status. Checked for real (see checkOnline) because a phone
  // with no data bundle still reports itself as "online".
  useEffect(() => {
    let alive = true
    const sync = () => {
      if (!navigator.onLine) setOnline(false)
      checkOnline().then((ok) => { if (alive) setOnline(ok) })
    }
    const onVisible = () => { if (document.visibilityState === 'visible') sync() }
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Quiz results: the device copy first, then (online only) merged with the account.
  useEffect(() => {
    setProgress(readLocalProgress())
    if (online) loadProgress().then(setProgress).catch(() => {})
  }, [online])

  // Is the page itself ready to open with no connection?
  useEffect(() => {
    let alive = true
    async function check() {
      if (await isOfflineShellCached()) { if (alive) setShell('ready'); return }
      if (!swSupported() || !online) { if (alive) setShell(swSupported() ? 'pending' : null); return }
      if (alive) setShell('working')
      const result = await ensureOfflineShell({ timeoutMs: 30000 })
      if (!alive) return
      if (!result.supported) setShell(null) // no service worker here (e.g. development without ?sw=1)
      else setShell((await isOfflineShellCached()) ? 'ready' : 'pending')
    }
    check()
    return () => { alive = false }
  }, [online])

  // Load the lesson named in the URL. Kept in state so it keeps playing even
  // if it is removed from the library while open.
  useEffect(() => {
    if (!openId) { setOpen(null); return undefined }
    let alive = true
    getSavedLesson(openId)
      .then((record) => { if (alive) setOpen(record ? { id: openId, record } : { id: openId, missing: true }) })
      .catch(() => { if (alive) setOpen({ id: openId, missing: true }) })
    return () => { alive = false }
  }, [openId])

  // Opening and closing only change the URL in the browser — no request is
  // made, so it works offline. Next.js keeps useSearchParams in sync.
  const openLesson = useCallback((id) => {
    openedFromList.current = true
    window.history.pushState(null, '', lessonUrl(id))
  }, [])

  const closeLesson = useCallback(() => {
    setProgress(readLocalProgress())
    if (openedFromList.current) {
      openedFromList.current = false
      window.history.back()
    } else {
      window.history.replaceState(null, '', '/downloads')
    }
  }, [])

  const removeRecord = useCallback(async (record) => {
    try {
      await removeLesson(record.id)
      toast.info(`Removed “${record.title}” from this device.`)
    } catch {
      toast.error('The lesson could not be removed. Please try again.')
    }
  }, [toast])

  // Links inside the player that point back at this page (close, back, next
  // lesson) are handled here instead of asking the server for the page again.
  function onPlayerClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const link = e.target.closest?.('a[href]')
    const href = link?.getAttribute('href')
    if (!href) return
    if (href === '/downloads') {
      e.preventDefault()
      closeLesson()
    } else if (href.startsWith('/downloads?lesson=')) {
      e.preventDefault()
      setProgress(readLocalProgress())
      window.history.replaceState(null, '', href)
      window.scrollTo(0, 0)
    }
  }

  if (records === null || (openId && open?.id !== openId)) return <DownloadsSkeleton />

  if (openId && open?.missing) return <NotSaved onBack={closeLesson} />

  if (openId && open?.record) {
    const lesson = open.record.lesson
    const siblings = records.filter((r) => r.course === open.record.course && r.subject === open.record.subject && r.topicSlug === open.record.topicSlug)
    const nextRecord = siblings[siblings.findIndex((r) => r.id === open.record.id) + 1]
    return (
      <div onClickCapture={onPlayerClick}>
        {!online ? (
          <p className="no-print bg-ink-900 px-4 py-2 text-center text-xs font-medium text-white">
            <WifiOff className="mr-1.5 inline h-3.5 w-3.5 align-[-2px] text-sun-400" aria-hidden="true" />
            You are offline — this saved lesson works without internet.
          </p>
        ) : null}
        <LessonPlayer
          key={lesson.id}
          lesson={lesson}
          meta={subjectMeta(lesson.subject)}
          backHref="/downloads"
          next={nextRecord ? { href: lessonUrl(nextRecord.id), title: nextRecord.title } : null}
          actions={<LessonDownload lesson={lesson} inLibrary />}
          onComplete={() => setProgress(readLocalProgress())}
        />
      </div>
    )
  }

  return (
    <Library
      records={records}
      progress={progress}
      online={online}
      shell={shell}
      onOpen={openLesson}
      onRemove={removeRecord}
    />
  )
}
