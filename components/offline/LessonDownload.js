'use client'
// components/offline/LessonDownload.js
//
// The offline actions for one lesson, shown on the lesson intro and result
// screens:
//   Save for offline  -> keeps the lesson in the in-app Downloads library
//   Download file     -> one self-contained .html file (works with no app)
//   Print / PDF       -> the same document, sent to the printer
//
// Props:
//   lesson     the full lesson object (high school or IELTS reading)
//   inLibrary  true when shown inside /downloads (hides the "find it in Downloads" hint)
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, Download, FileDown, Loader2, Printer, WifiOff } from 'lucide-react'
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
    try {
      await saveLesson(lesson)
      setSaved(true)
      const shell = await ensureOfflineShell({ timeoutMs: 20000 })
      const message = savedMessage(shell)
      toast[message.type](message.text)
    } catch (err) {
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

  return (
    <section className="card card-pad no-print" aria-label="Use this lesson offline">
      <div className="flex items-start gap-3.5">
        <span className="icon-tile bg-blue-50 text-blue-700"><WifiOff className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-semibold leading-snug text-ink-900">Study this lesson without data</h2>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-500">
            {saved
              ? 'This lesson is saved on this device. You can also download it as a file to share with a classmate.'
              : 'Save it on this device, or download a file you can open and share with no internet.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {saved ? (
          <div className="inline-flex min-h-[44px] items-stretch overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold">
            <span className="inline-flex items-center gap-2 px-4 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Saved
            </span>
            <button
              type="button"
              onClick={remove}
              className={`border-l border-emerald-200 px-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${confirmRemove ? 'bg-rose-50 text-rose-700' : 'text-ink-500 hover:bg-white hover:text-ink-800'}`}
            >
              {confirmRemove ? 'Tap again to remove' : 'Remove'}
            </button>
          </div>
        ) : (
          <button type="button" className="btn-dark" onClick={save} disabled={busy || saved === null}>
            {busy
              ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving…</>
              : <><Download className="h-4 w-4" aria-hidden="true" /> Save for offline</>}
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={downloadFile}>
          <FileDown className="h-4 w-4" aria-hidden="true" /> Download file
        </button>
        <button type="button" className="btn-ghost" onClick={printLesson}>
          <Printer className="h-4 w-4" aria-hidden="true" /> Print / PDF
        </button>
      </div>

      {saved && !inLibrary ? (
        <p className="mt-3 text-sm text-ink-500" role="status">
          Open it any time from <Link href="/downloads" className="font-semibold text-blue-700 underline-offset-2 hover:underline">Downloads</Link> — no data needed.
        </p>
      ) : null}
    </section>
  )
}
