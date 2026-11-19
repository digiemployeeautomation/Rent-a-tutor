'use client'
// components/offline/LessonDownload.js
//
// The offline actions for one lesson, as one quiet ruled row on the lesson
// intro and result screens:
//   Save for offline  -> keeps the lesson in the in-app Downloads library
//   Download file     -> one self-contained .html file (works with no app)
//   Print             -> the same document, sent to the printer (or saved as PDF)
//
// Props:
//   lesson     the full lesson object (high school or IELTS reading)
//   inLibrary  true when shown inside /downloads (hides the "find it in Downloads" hint)
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, Download, FileDown, Loader2, Printer, RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { getSavedLesson, lessonId, removeLesson, saveLesson, subscribe } from '@/lib/offline/store'
import { ensureOfflineShell } from '@/lib/offline/sw-client'
import { exportFileName, lessonToHtml } from '@/lib/offline/export-html'

function savedMessage(shell) {
  if (shell.ok) return { type: 'success', text: 'Saved. This lesson now opens from Downloads without internet.' }
  if (!shell.supported) {
    if (process.env.NODE_ENV !== 'production') {
      return { type: 'info', text: 'Saved on this device. Development: add ?sw=1 to the address once to switch on offline mode.' }
    }
    return { type: 'info', text: 'Saved on this device. This browser cannot open the app offline, so use “Download file” for a copy that always works.' }
  }
  return { type: 'info', text: 'Saved on this device. Open Downloads once while you are online to finish setting up offline use.' }
}

export default function LessonDownload({ lesson, inLibrary = false }) {
  const toast = useToast()
  const id = lessonId(lesson)
  const [saved, setSaved] = useState(null) // null = still checking
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    if (!id) return undefined
    let alive = true
    const check = () => getSavedLesson(id).then((r) => { if (alive) setSaved(!!r) }).catch(() => { if (alive) setSaved(false) })
    check()
    const unsubscribe = subscribe(check)
    return () => { alive = false; unsubscribe() }
  }, [id])

  useEffect(() => {
    if (!confirmRemove) return undefined
    const t = setTimeout(() => setConfirmRemove(false), 4000)
    return () => clearTimeout(t)
  }, [confirmRemove])

  if (!lesson || !id) return null

  async function save() {
    if (busy) return
    setBusy(true)
    setFailed(false)
    try {
      await saveLesson(lesson)
      setSaved(true)
      const shell = await ensureOfflineShell({ timeoutMs: 20000 })
      const message = savedMessage(shell)
      toast[message.type](message.text)
    } catch (err) {
      setFailed(true)
      toast.error(err?.name === 'OfflineStorageError' ? err.message : 'The lesson could not be saved. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirmRemove) { setConfirmRemove(true); return }
    setConfirmRemove(false)
    try {
      await removeLesson(id)
      setSaved(false)
      toast.info('Removed from this device.')
    } catch {
      toast.error('The lesson could not be removed. Please try again.')
    }
  }

  function downloadFile() {
    try {
      const name = exportFileName(lesson)
      const url = URL.createObjectURL(new Blob([lessonToHtml(lesson)], { type: 'text/html;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 30000)
      toast.success(`Downloaded ${name}. Open it from your files any time — it works without internet.`)
    } catch {
      toast.error('The file could not be created. Please try again.')
    }
  }

  // Prints the same document as "Download file" from a hidden frame, so the
  // student stays on the lesson. All answers and explanations are shown.
  function printLesson() {
    let html
    try { html = lessonToHtml(lesson) } catch { toast.error('The lesson could not be prepared for printing.'); return }
    try {
      document.getElementById('rat-print-frame')?.remove()
      const frame = document.createElement('iframe')
      frame.id = 'rat-print-frame'
      frame.title = 'Print lesson'
      frame.setAttribute('aria-hidden', 'true')
      frame.tabIndex = -1
      frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:600px;border:0;opacity:0;pointer-events:none'
      frame.onload = () => {
        try {
          const win = frame.contentWindow
          win.addEventListener('afterprint', () => setTimeout(() => frame.remove(), 500))
          win.focus()
          win.print()
        } catch {
          frame.remove()
          const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
          window.open(url, '_blank', 'noopener')
          setTimeout(() => URL.revokeObjectURL(url), 60000)
        }
      }
      frame.srcdoc = html
      document.body.appendChild(frame)
    } catch {
      toast.error('Printing is not available in this browser. Use “Download file” and print that instead.')
    }
  }

  const note = failed
    ? 'This lesson could not be saved. Free some space on your device, then try again.'
    : saved
      ? (inLibrary ? 'Saved on this device. It opens without internet or data.' : null)
      : 'Save it on this device, or take a file you can share with a classmate.'

  return (
    <section className="no-print border-y border-ink-200 py-5 sm:flex sm:items-center sm:justify-between sm:gap-6" aria-label="Use this lesson offline">
      <div className="min-w-0">
        <h2 className="h-sub">Study without data</h2>
        <p className={`mt-0.5 text-sm leading-snug ${failed ? 'font-semibold text-rose-700' : 'text-ink-600'}`} role="status">
          {note || (
            <>Saved on this device. Find it in <Link href="/downloads" className="link">Downloads</Link>.</>
          )}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 sm:mt-0 sm:shrink-0 sm:flex-nowrap">
        {saved ? (
          <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start">
            <span className="inline-flex min-h-[44px] items-center gap-1.5 pr-2 text-[15px] font-bold text-board-700">
              <Check className="h-[18px] w-[18px]" strokeWidth={3} aria-hidden="true" /> Saved
            </span>
            <button
              type="button"
              onClick={remove}
              className={`btn -mr-3 !px-3 sm:mr-0 ${confirmRemove ? 'bg-rose-50 text-rose-700' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'}`}
            >
              {confirmRemove ? 'Tap again to remove' : 'Remove'}
            </button>
          </div>
        ) : (
          <button type="button" className="btn-secondary w-full !px-4 sm:w-auto" onClick={save} disabled={busy || saved === null}>
            {busy
              ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving…</>
              : failed
                ? <><RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again</>
                : <><Download className="h-4 w-4" aria-hidden="true" /> Save for offline</>}
          </button>
        )}
        <button type="button" className="btn-ghost -ml-3 !px-3 sm:ml-0" onClick={downloadFile}>
          <FileDown className="h-4 w-4 text-ink-400" aria-hidden="true" /> Download file
        </button>
        <button type="button" className="btn-ghost !px-3" onClick={printLesson}>
          <Printer className="h-4 w-4 text-ink-400" aria-hidden="true" /> Print
        </button>
      </div>
    </section>
  )
}
