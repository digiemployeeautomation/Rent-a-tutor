// app/dashboard/tutor/(shell)/lessons/page.js
'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { SUBJECTS, FORM_LEVELS } from '@/lib/constants'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── Edit Modal ─────────────────────────────────────────────── */
function EditModal({ lesson, onClose, onSaved }) {
  const [title, setTitle]             = useState(lesson.title)
  const [subject, setSubject]         = useState(lesson.subject)
  const [formLevel, setFormLevel]     = useState(lesson.form_level ?? FORM_LEVELS[0])
  const [price, setPrice]             = useState(String(lesson.price))
  const [description, setDescription] = useState(lesson.description ?? '')
  const [videoId, setVideoId]         = useState(lesson.cloudflare_video_id ?? '')
  const [duration, setDuration]       = useState(lesson.duration_seconds ? String(Math.round(lesson.duration_seconds / 60)) : '')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    const priceNum = parseInt(price, 10)
    if (isNaN(priceNum) || priceNum < 10) { setError('Price must be at least K10.'); return }

    setSaving(true)
    const durationSecs = duration ? parseInt(duration, 10) * 60 : null

    const { error: updateErr } = await supabase
      .from('lessons')
      .update({
        title:               title.trim(),
        subject,
        form_level:          formLevel,
        price:               priceNum,
        description:         description.trim() || null,
        cloudflare_video_id: videoId.trim() || null,
        duration_seconds:    durationSecs,
      })
      .eq('id', lesson.id)

    setSaving(false)
    if (updateErr) { setError(updateErr.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}>
      <form onSubmit={handleSave}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>Edit lesson</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Form level</label>
              <select value={formLevel} onChange={e => setFormLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                {FORM_LEVELS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price (ZMW)</label>
              <input type="number" required min="10" max="5000" value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Duration (min)</label>
              <input type="number" min="1" max="600" value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Video ID (Cloudflare or YouTube)</label>
            <input type="text" value={videoId} onChange={e => setVideoId(e.target.value)}
              placeholder="e.g. ea95132c15732412d22c1476fa83f27a"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none font-mono" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          <button type="button" onClick={onClose} className="text-sm text-gray-500">Cancel</button>
          <button type="submit" disabled={saving}
            className="text-sm px-5 py-2 rounded-lg font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Delete Confirmation Modal ──────────────────────────────── */
function DeleteModal({ lesson, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState('')

  async function handleDelete() {
    setDeleting(true)
    const { error: deleteErr } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lesson.id)

    if (deleteErr) {
      setError(deleteErr.message)
      setDeleting(false)
      return
    }
    onDeleted(lesson.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget && !deleting) onClose() }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-serif text-lg text-red-600">Delete lesson</h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-1">
            Are you sure you want to delete <strong>{lesson.title}</strong>?
          </p>
          <p className="text-xs text-gray-400">This cannot be undone. Students who purchased this lesson will lose access.</p>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          <button onClick={onClose} className="text-sm text-gray-500">Cancel</button>
          <button onClick={handleDelete} disabled={deleting}
            className="text-sm px-5 py-2 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#dc2626' }}>
            {deleting ? 'Deleting...' : 'Delete lesson'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function TutorLessonsPage() {
  const router = useRouter()
  const [lessons, setLessons]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [editing, setEditing]     = useState(null)
  const [deleting, setDeleting]   = useState(null)
  const [menuOpen, setMenuOpen]   = useState(null)
  const [isApproved, setIsApproved] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const [{ data }, { data: tutorData }] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title, subject, form_level, price, status, purchase_count, duration_seconds, description, cloudflare_video_id, created_at')
          .eq('tutor_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('tutors')
          .select('is_approved')
          .eq('user_id', user.id)
          .single(),
      ])

      setLessons(data ?? [])
      setIsApproved(tutorData?.is_approved ?? false)
      setLoading(false)
    }
    load()
  }, [router])

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function toggleStatus(lesson) {
    const newStatus = lesson.status === 'active' ? 'draft' : 'active'
    if (newStatus === 'active' && !isApproved) return

    const { error } = await supabase
      .from('lessons')
      .update({ status: newStatus })
      .eq('id', lesson.id)

    if (!error) {
      setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, status: newStatus } : l))
    }
    setMenuOpen(null)
  }

  function handleSaved() {
    setEditing(null)
    // Reload lessons
    router.refresh()
    window.location.reload()
  }

  function handleDeleted(id) {
    setDeleting(null)
    setLessons(prev => prev.filter(l => l.id !== id))
  }

  const shown = filter === 'all' ? lessons : lessons.filter(l => l.status === filter)

  const counts = {
    all:    lessons.length,
    active: lessons.filter(l => l.status === 'active').length,
    draft:  lessons.filter(l => l.status === 'draft').length,
  }

  /* ── Action menu for a lesson row ──────────────────────────── */
  function ActionMenu({ lesson }) {
    const isOpen = menuOpen === lesson.id
    return (
      <div className="relative" ref={isOpen ? menuRef : null}>
        <button onClick={() => setMenuOpen(isOpen ? null : lesson.id)}
          className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 text-sm">
          ···
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30 w-44">
            <button onClick={() => { setEditing(lesson); setMenuOpen(null) }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Edit lesson
            </button>
            <button onClick={() => toggleStatus(lesson)}
              disabled={lesson.status === 'draft' && !isApproved}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: lesson.status === 'active' ? '#d97706' : 'var(--color-primary)' }}>
              {lesson.status === 'active' ? 'Unpublish' : 'Publish'}
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button onClick={() => { setDeleting(lesson); setMenuOpen(null) }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Delete lesson
            </button>
          </div>
        )}
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-gray-400">Loading lessons...</div>
    </div>
  )

  return (
    <>
      {/* ── Banner ── */}
      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-4 sm:px-6 py-5">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-start gap-3">
          <div>
            <nav className="text-xs mb-2 opacity-60" style={{ color: 'var(--color-nav-text)' }}>
              <Link href="/dashboard/tutor" className="hover:opacity-100">Dashboard</Link>
              {' / '}My Lessons
            </nav>
            <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>My Lessons</h1>
            <p className="text-sm mt-0.5 opacity-70" style={{ color: 'var(--color-nav-text)' }}>
              {counts.active} live · {counts.draft} draft
            </p>
          </div>
          <Link href="/dashboard/tutor/upload"
            className="text-sm px-5 py-2.5 rounded-lg font-medium self-start"
            style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}>
            + Upload lesson
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Filter tabs */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit gap-1">
          {[
            { key: 'all',    label: `All (${counts.all})`       },
            { key: 'active', label: `Live (${counts.active})`   },
            { key: 'draft',  label: `Drafts (${counts.draft})`  },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="text-sm px-4 py-2 rounded-lg transition font-medium"
              style={filter === t.key
                ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-nav-text)' }
                : { color: '#6b7280' }}>
              {t.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm text-gray-400 mb-3">
              {filter === 'all' ? 'No lessons uploaded yet.' : `No ${filter} lessons.`}
            </p>
            <Link href="/dashboard/tutor/upload"
              className="text-xs px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              Upload your first lesson
            </Link>
          </div>
        ) : (
          <>
            {/* ── Desktop table — hidden on mobile ────────────────── */}
            <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="grid px-5 py-3 border-b border-gray-100 text-xs font-medium text-gray-400"
                style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 80px 48px' }}>
                <span>Lesson</span>
                <span>Price</span>
                <span>Purchases</span>
                <span>Uploaded</span>
                <span>Status</span>
                <span></span>
              </div>

              {shown.map((l, i) => (
                <div key={l.id}
                  className={`grid px-5 py-4 items-center gap-4 hover:bg-gray-50 transition ${i < shown.length - 1 ? 'border-b border-gray-50' : ''}`}
                  style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 80px 48px' }}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{l.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{l.subject} · {l.form_level ?? 'All levels'}</div>
                  </div>
                  <span className="text-sm text-gray-700">K{l.price}</span>
                  <span className="text-sm text-gray-700">{l.purchase_count ?? 0}</span>
                  <span className="text-xs text-gray-400">{formatDate(l.created_at)}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize text-center"
                    style={{
                      backgroundColor: l.status === 'active' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)',
                      color: l.status === 'active' ? 'var(--color-badge-text)' : 'var(--color-stat-b-sub)',
                    }}>
                    {l.status ?? 'draft'}
                  </span>
                  <ActionMenu lesson={l} />
                </div>
              ))}
            </div>

            {/* ── Mobile cards — hidden on desktop ────────────────── */}
            <div className="lg:hidden space-y-3">
              {shown.map(l => (
                <div key={l.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4">
                  {/* Title + status + menu */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-800 leading-snug">{l.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{l.subject} · {l.form_level ?? 'All levels'}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                        style={{
                          backgroundColor: l.status === 'active' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)',
                          color: l.status === 'active' ? 'var(--color-badge-text)' : 'var(--color-stat-b-sub)',
                        }}>
                        {l.status ?? 'draft'}
                      </span>
                      <ActionMenu lesson={l} />
                    </div>
                  </div>
                  {/* Stats row */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xs text-gray-400">Price</div>
                        <div className="text-sm font-medium text-gray-800">K{l.price}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Purchases</div>
                        <div className="text-sm font-medium text-gray-800">{l.purchase_count ?? 0}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Uploaded</div>
                      <div className="text-xs text-gray-600">{formatDate(l.created_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {editing && <EditModal lesson={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
      {deleting && <DeleteModal lesson={deleting} onClose={() => setDeleting(null)} onDeleted={handleDeleted} />}
    </>
  )
}
