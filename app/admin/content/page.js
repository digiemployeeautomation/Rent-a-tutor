// app/admin/content/page.js
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiGet(params) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`/api/admin/content?${qs}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Request failed')
  return json.data
}

async function apiPost(entity, data) {
  const res = await fetch('/api/admin/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity, data }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Insert failed')
  return json.data
}

async function apiPut(entity, id, data) {
  const res = await fetch('/api/admin/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity, id, data }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Update failed')
  return json.data
}

async function apiDelete(entity, id) {
  const res = await fetch('/api/admin/content', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity, id }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Delete failed')
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    coming_soon: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status?.replace('_', ' ') ?? 'unknown'}
    </span>
  )
}

// ── Inline Edit Field ─────────────────────────────────────────────────────────

function InlineEdit({ value, onSave, placeholder }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  function handleSave() {
    onSave(val)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        className="cursor-pointer hover:underline text-gray-800"
        onDoubleClick={() => setEditing(true)}
        title="Double-click to edit"
      >
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        className="border border-gray-300 rounded px-2 py-0.5 text-sm"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setEditing(false)
        }}
      />
      <button onClick={handleSave} className="text-xs text-green-600 font-medium">Save</button>
      <button onClick={() => setEditing(false)} className="text-xs text-gray-400">Cancel</button>
    </span>
  )
}

// ── Lesson Row ────────────────────────────────────────────────────────────────

function LessonRow({ lesson, onUpdate, onDelete }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function saveTitle(title) {
    setBusy(true); setErr(null)
    try {
      const updated = await apiPut('lessons', lesson.id, { title })
      onUpdate({ ...lesson, title: updated.title })
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return
    setBusy(true); setErr(null)
    try {
      await apiDelete('lessons', lesson.id)
      onDelete(lesson.id)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-2 py-1.5 pl-4 group">
      <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
      <InlineEdit value={lesson.title} onSave={saveTitle} placeholder="Untitled lesson" />
      <StatusBadge status={lesson.status} />
      {err && <span className="text-red-500 text-xs">{err}</span>}
      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => router.push(`/admin/content/${lesson.id}`)}
          className="text-xs text-blue-600 hover:underline px-1"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-xs text-red-500 hover:underline px-1"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ── Topic Section ─────────────────────────────────────────────────────────────

function TopicSection({ topic, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [lessons, setLessons] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    if (lessons !== null) { setOpen(o => !o); return }
    setOpen(true); setLoading(true)
    try {
      const data = await apiGet({ entity: 'lessons', topicId: topic.id })
      setLessons(data)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  async function saveTitle(title) {
    setBusy(true); setErr(null)
    try {
      const updated = await apiPut('topics', topic.id, { title })
      onUpdate({ ...topic, title: updated.title })
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete topic "${topic.title}"?`)) return
    setBusy(true); setErr(null)
    try {
      await apiDelete('topics', topic.id)
      onDelete(topic.id)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  async function addLesson() {
    const title = prompt('New lesson title:')
    if (!title) return
    setBusy(true); setErr(null)
    try {
      const next = await apiPost('lessons', {
        topic_id: topic.id,
        title,
        status: 'draft',
        order: (lessons?.length ?? 0) + 1,
      })
      setLessons(prev => [...(prev ?? []), next])
      setOpen(true)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  function updateLesson(updated) {
    setLessons(prev => prev.map(l => l.id === updated.id ? updated : l))
  }
  function deleteLesson(id) {
    setLessons(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="ml-4 border-l border-gray-100 pl-3 mt-1">
      <div className="flex items-center gap-2 py-1 group">
        <button onClick={load} className="text-gray-400 text-xs w-4 text-center">
          {open ? '▼' : '▶'}
        </button>
        <InlineEdit value={topic.title} onSave={saveTitle} placeholder="Untitled topic" />
        {err && <span className="text-red-500 text-xs">{err}</span>}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={addLesson} disabled={busy} className="text-xs text-green-600 hover:underline px-1">
            + Lesson
          </button>
          <button onClick={handleDelete} disabled={busy} className="text-xs text-red-500 hover:underline px-1">
            Delete
          </button>
        </div>
      </div>

      {open && (
        <div className="ml-4">
          {loading && <p className="text-xs text-gray-400 py-1">Loading...</p>}
          {lessons?.map(lesson => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              onUpdate={updateLesson}
              onDelete={deleteLesson}
            />
          ))}
          {lessons?.length === 0 && <p className="text-xs text-gray-400 py-1">No lessons yet.</p>}
        </div>
      )}
    </div>
  )
}

// ── Unit Section ──────────────────────────────────────────────────────────────

function UnitSection({ unit, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [topics, setTopics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    if (topics !== null) { setOpen(o => !o); return }
    setOpen(true); setLoading(true)
    try {
      const data = await apiGet({ entity: 'topics', unitId: unit.id })
      setTopics(data)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  async function saveTitle(title) {
    setBusy(true); setErr(null)
    try {
      const updated = await apiPut('units', unit.id, { title })
      onUpdate({ ...unit, title: updated.title })
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete unit "${unit.title}"?`)) return
    setBusy(true); setErr(null)
    try {
      await apiDelete('units', unit.id)
      onDelete(unit.id)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  async function addTopic() {
    const title = prompt('New topic title:')
    if (!title) return
    setBusy(true); setErr(null)
    try {
      const next = await apiPost('topics', {
        unit_id: unit.id,
        title,
        order: (topics?.length ?? 0) + 1,
      })
      setTopics(prev => [...(prev ?? []), next])
      setOpen(true)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  function updateTopic(updated) {
    setTopics(prev => prev.map(t => t.id === updated.id ? updated : t))
  }
  function deleteTopic(id) {
    setTopics(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="ml-3 border-l border-gray-200 pl-3 mt-1">
      <div className="flex items-center gap-2 py-1 group">
        <button onClick={load} className="text-gray-400 text-xs w-4 text-center">
          {open ? '▼' : '▶'}
        </button>
        <span className="text-xs text-gray-400 font-mono">U{unit.number}</span>
        <InlineEdit value={unit.title} onSave={saveTitle} placeholder="Untitled unit" />
        {err && <span className="text-red-500 text-xs">{err}</span>}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={addTopic} disabled={busy} className="text-xs text-green-600 hover:underline px-1">
            + Topic
          </button>
          <button onClick={handleDelete} disabled={busy} className="text-xs text-red-500 hover:underline px-1">
            Delete
          </button>
        </div>
      </div>

      {open && (
        <div>
          {loading && <p className="text-xs text-gray-400 py-1 ml-4">Loading...</p>}
          {topics?.map(topic => (
            <TopicSection
              key={topic.id}
              topic={topic}
              onUpdate={updateTopic}
              onDelete={deleteTopic}
            />
          ))}
          {topics?.length === 0 && <p className="text-xs text-gray-400 py-1 ml-6">No topics yet.</p>}
        </div>
      )}
    </div>
  )
}

// ── Subject Section ───────────────────────────────────────────────────────────

function SubjectSection({ subject, termId }) {
  const [open, setOpen] = useState(false)
  const [units, setUnits] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    if (units !== null) { setOpen(o => !o); return }
    setOpen(true); setLoading(true)
    try {
      const params = { entity: 'units', subjectId: subject.id }
      if (termId) params.termId = termId
      const data = await apiGet(params)
      setUnits(data)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  async function addUnit() {
    const title = prompt('New unit title:')
    if (!title) return
    if (!termId) { alert('Select a term first'); return }
    const numberStr = prompt('Unit number (e.g. 1):')
    if (!numberStr) return
    setBusy(true); setErr(null)
    try {
      const next = await apiPost('units', {
        subject_id: subject.id,
        term_id: termId,
        title,
        number: parseInt(numberStr, 10) || 1,
      })
      setUnits(prev => [...(prev ?? []), next])
      setOpen(true)
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  function updateUnit(updated) {
    setUnits(prev => prev.map(u => u.id === updated.id ? updated : u))
  }
  function deleteUnit(id) {
    setUnits(prev => prev.filter(u => u.id !== id))
  }

  return (
    <div className="border border-gray-200 rounded-lg mb-2 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 cursor-pointer" onClick={load}>
        <span className="text-gray-400 text-xs w-4 text-center">{open ? '▼' : '▶'}</span>
        <span className="font-medium text-gray-800">{subject.name}</span>
        {err && <span className="text-red-500 text-xs">{err}</span>}
        <div className="ml-auto" onClick={e => e.stopPropagation()}>
          <button onClick={addUnit} disabled={busy} className="text-xs text-green-600 hover:underline px-2 py-1">
            + Unit
          </button>
        </div>
      </div>

      {open && (
        <div className="px-2 py-2 bg-white">
          {loading && <p className="text-xs text-gray-400 py-1 ml-3">Loading...</p>}
          {units?.map(unit => (
            <UnitSection
              key={unit.id}
              unit={unit}
              onUpdate={updateUnit}
              onDelete={deleteUnit}
            />
          ))}
          {units?.length === 0 && <p className="text-xs text-gray-400 py-2 ml-6">No units yet.</p>}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContentManagementPage() {
  const [forms, setForms] = useState([])
  const [terms, setTerms] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedFormId, setSelectedFormId] = useState('')
  const [selectedTermId, setSelectedTermId] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  // Load forms and subjects on mount
  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [{ data: formsData }, { data: subjectsData }] = await Promise.all([
          supabase.from('forms').select('*').order('level', { ascending: true }),
          supabase.from('subjects_new').select('*').order('name'),
        ])
        setForms(formsData ?? [])
        setSubjects(subjectsData ?? [])
      } catch (e) {
        setErr(e.message)
      }
      setLoading(false)
    }
    init()
  }, [])

  // Load terms when form changes
  useEffect(() => {
    if (!selectedFormId) { setTerms([]); setSelectedTermId(''); return }
    supabase
      .from('terms')
      .select('*')
      .eq('form_id', selectedFormId)
      .order('number', { ascending: true })
      .then(({ data }) => {
        setTerms(data ?? [])
        setSelectedTermId('')
      })
  }, [selectedFormId])

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900">Content Management</h1>
        <p className="text-sm text-gray-500 mt-1">Browse and edit units, topics, and lessons.</p>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">{err}</div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Form</label>
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedFormId}
            onChange={e => setSelectedFormId(e.target.value)}
          >
            <option value="">All forms</option>
            {forms.map(f => (
              <option key={f.id} value={f.id}>{f.name ?? `Form ${f.level}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Term</label>
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedTermId}
            onChange={e => setSelectedTermId(e.target.value)}
            disabled={!selectedFormId}
          >
            <option value="">All terms</option>
            {terms.map(t => (
              <option key={t.id} value={t.id}>{t.name ?? `Term ${t.number}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content tree */}
      <div>
        {subjects.length === 0 ? (
          <p className="text-gray-400 text-sm">No subjects found.</p>
        ) : (
          subjects.map(subject => (
            <SubjectSection
              key={subject.id}
              subject={subject}
              termId={selectedTermId || null}
            />
          ))
        )}
      </div>
    </div>
  )
}
