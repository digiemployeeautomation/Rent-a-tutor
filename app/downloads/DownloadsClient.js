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
import { ArrowLeft, ArrowRight, Check, Loader2, Trash2, WifiOff } from 'lucide-react'
import SubjectArt from '@/components/art/SubjectArt'
import LessonPlayer from '@/components/lesson/LessonPlayer'
import LessonDownload from '@/components/offline/LessonDownload'
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
    <div className="container-app pb-16 pt-8 sm:pt-14" aria-busy="true" aria-label="Loading your downloads">
      <div className="h-9 w-48 rounded bg-ink-100" />
      <div className="mt-4 h-5 w-80 max-w-full rounded bg-ink-100" />
      <div className="mt-12 h-6 w-40 rounded bg-ink-100" />
      <div className="mt-3 border-t-2 border-ink-200">
        <div className="h-[76px] border-b border-ink-200" />
        <div className="h-[76px] border-b border-ink-200" />
      </div>
    </div>
  )
}

// ── Small pieces ─────────────────────────────────────────────────────────────

// What is on this device and whether it is ready, in plain words.
function Status({ online, records, shell }) {
  const bytes = records.reduce((n, r) => n + (r.bytes || 0), 0)
  if (online && records.length === 0 && !shell) return null
  return (
    <div className="mt-5" aria-live="polite">
      {!online ? (
        <p className="mb-4 flex max-w-xl items-start gap-2.5 rounded-lg bg-sun-100 px-4 py-3 text-[15px] leading-snug text-ink-900">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span><strong className="font-bold">You are offline.</strong> Saved lessons still work.</span>
        </p>
      ) : null}
      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px] text-ink-600">
        {records.length > 0 ? (
          <span>
            <span className="font-bold text-ink-900 tabular">{records.length} {records.length === 1 ? 'lesson' : 'lessons'}</span>
            {' '}saved, about {formatBytes(bytes)} on this device
          </span>
        ) : null}
        {shell === 'ready' ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-board-700">
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> Ready to use offline
          </span>
        ) : shell === 'working' ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-4 w-4 animate-spin text-ink-400" aria-hidden="true" /> Getting ready for offline…
          </span>
        ) : shell === 'pending' ? (
          <span className="font-semibold text-sun-800">Offline setup is not finished. Open this page once with internet.</span>
        ) : null}
      </p>
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
      <div className="mt-14 flex items-center justify-between gap-4 border-y border-ink-200 py-4">
        <div className="min-w-0">
          <p className="h-sub">Install the app</p>
          <p className="mt-0.5 text-sm leading-snug text-ink-600">Open your saved lessons from your home screen with one tap.</p>
        </div>
        <button type="button" className="btn-secondary shrink-0" onClick={install}>Install</button>
      </div>
    )
  }
  if (ios) {
    return (
      <p className="mt-14 max-w-xl border-t border-ink-200 pt-4 text-sm leading-relaxed text-ink-600">
        <strong className="font-bold text-ink-900">On iPhone or iPad:</strong> tap Share, then “Add to Home Screen” to keep Rent a Tutor one tap away.
      </p>
    )
  }
  return null
}

const HOW = [
  { title: 'Open a lesson', text: 'While you have internet, open any lesson you want to keep.' },
  { title: 'Tap “Save for offline”', text: 'The whole lesson is kept on this device, with its diagrams and quiz.' },
  { title: 'Study with no data', text: 'Come back to Downloads any time. Saved lessons open without internet.' },
]

function EmptyState({ online }) {
  return (
    <div className="mt-10 sm:mt-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">
        <SubjectArt name="offline" className="-ml-3 h-28 w-28 sm:ml-0 sm:h-36 sm:w-36" />
        <div className="min-w-0">
          <h2 className="h-section">No lessons saved yet</h2>
          <p className="mt-2 max-w-[52ch] text-[17px] leading-[1.55] text-ink-600">
            Save a lesson while you have internet. After that it opens here any time: on the bus, at home, or when your data runs out.
          </p>
          {online ? (
            <Link href="/learn/high-school" className="btn-primary btn-lg group mt-6 w-full sm:w-auto">
              Pick a lesson to save <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
            </Link>
          ) : (
            <p className="mt-5 text-[15px] font-semibold text-ink-900">Connect to the internet to save your first lesson.</p>
          )}
        </div>
      </div>

      <section className="mt-14 sm:mt-20" aria-labelledby="how-offline">
        <h2 id="how-offline" className="h-section">How it works</h2>
        <ol className="mt-6 grid gap-7 sm:grid-cols-3 sm:gap-10">
          {HOW.map((s, i) => (
            <li key={s.title} className="flex gap-4 border-t border-ink-300 pt-4 sm:block">
              <span className="numeral block w-7 shrink-0 text-[2.25rem] leading-none text-copper-600" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="h-sub sm:mt-3">{s.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function LessonRow({ record, index, result, onOpen, onRemove }) {
  const [confirm, setConfirm] = useState(false)
  const passed = !!result?.passed
  const number = record.order > 0 ? record.order : index + 1

  useEffect(() => {
    if (!confirm) return undefined
    const t = setTimeout(() => setConfirm(false), 4000)
    return () => clearTimeout(t)
  }, [confirm])

  return (
    <li className="flex items-start gap-1 sm:items-center sm:gap-3">
      <a
        href={lessonUrl(record.id)}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
          e.preventDefault()
          onOpen(record.id)
        }}
        className="group flex min-w-0 flex-1 items-start gap-4 py-4 sm:items-center sm:gap-5 sm:py-5"
      >
        <span className="flex w-8 shrink-0 justify-center pt-0.5 sm:w-10 sm:pt-0">
          {passed ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-board-700 text-chalk"><Check className="h-4 w-4" strokeWidth={3} aria-label="Passed" /></span>
          ) : (
            <span className="numeral text-[1.75rem] leading-8 text-ink-300" aria-hidden="true">{number}</span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold leading-snug text-ink-900 decoration-ink-900 decoration-2 underline-offset-4 group-hover:underline">{record.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] font-semibold text-ink-500">
            {record.minutes ? <span>{record.minutes} min</span> : null}
            <span>Saved {savedDate(record.savedAt)}</span>
            {record.bytes ? <span className="tabular">{formatBytes(record.bytes)}</span> : null}
            {passed
              ? <span className="text-board-700">Passed {result.score}/{result.total}</span>
              : result ? <span className="text-sun-700">Last try {result.score}/{result.total}</span> : null}
          </span>
          <span className="mt-2.5 inline-flex items-center gap-1.5 text-[15px] font-bold text-board-700 sm:hidden">
            Open lesson <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </span>
        <span className="btn-secondary btn-sm hidden shrink-0 group-hover:border-ink-900 sm:inline-flex">Open <ArrowRight className="nudge h-4 w-4" aria-hidden="true" /></span>
      </a>
      {confirm ? (
        <button
          type="button"
          onClick={() => onRemove(record)}
          className="mt-2.5 min-h-[44px] shrink-0 rounded-lg bg-rose-50 px-3 text-[13px] font-bold text-rose-700 hover:bg-rose-100 sm:mt-0"
        >
          Remove?
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          aria-label={`Remove ${record.title} from this device`}
          title="Remove from this device"
          className="-mr-2.5 mt-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-rose-700 sm:mt-0"
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
    <div className="container-app pb-16 pt-8 sm:pt-14">
      <header className="flex items-start justify-between gap-8">
        <div className="min-w-0 max-w-2xl">
          <h1 className="h-page">Downloads</h1>
          <p className="lead mt-3">Lessons saved on this device. They open without internet or data.</p>
          <Status online={online} records={records} shell={shell} />
        </div>
        {records.length > 0 ? <SubjectArt name="offline" className="hidden h-24 w-24 sm:block" /> : null}
      </header>

      {records.length === 0 ? <EmptyState online={online} /> : (
        <div className="mt-10 space-y-12 sm:mt-14">
          {courses.map((course) => course.groups.map((group) => {
            const meta = subjectMeta(group.subject)
            const subjectName = meta?.name || prettySlug(group.subject) || course.name
            const heading = group.topic || subjectName
            const place = [
              course.name,
              subjectName.toLowerCase() === heading.toLowerCase() || subjectName === course.name ? '' : subjectName,
              group.form ? `Form ${group.form}` : '',
              group.form && group.term ? `Term ${group.term}` : '',
            ].filter(Boolean).join(' · ')
            const headingId = `saved-${group.key.replace(/[^a-z0-9]+/gi, '-')}`
            return (
              <section key={`${course.course}/${group.key}`} aria-labelledby={headingId}>
                <header className="rule-head items-end">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink-500">{place}</p>
                    <h2 id={headingId} className="h-section mt-0.5">{heading}</h2>
                  </div>
                  <p className="shrink-0 text-[13px] font-semibold text-ink-500 tabular">{group.records.length} saved</p>
                </header>
                <ol className="rows">
                  {group.records.map((r, i) => (
                    <LessonRow key={r.id} record={r} index={i} result={progress[r.id]} onOpen={onOpen} onRemove={onRemove} />
                  ))}
                </ol>
              </section>
            )
          }))}
          {online ? (
            <p className="text-[15px] text-ink-600">
              Want more? <Link href="/learn/high-school" className="link">Browse the high-school lessons</Link> and save them here.
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
    <div className="container-read py-12 sm:py-16">
      <SubjectArt name="offline" className="h-24 w-24" />
      <h1 className="h-page mt-6">This lesson is not saved on this device</h1>
      <p className="lead mt-3">
        It may have been removed, or saved in a different browser. Open the lesson online and tap “Save for offline” to keep it here.
      </p>
      <button type="button" className="btn-primary mt-7" onClick={onBack}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Downloads</button>
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
          <p className="no-print bg-sun-100 px-5 py-2 text-center text-[13px] font-semibold text-ink-900">
            <WifiOff className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
            You are offline. This saved lesson works without internet.
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
