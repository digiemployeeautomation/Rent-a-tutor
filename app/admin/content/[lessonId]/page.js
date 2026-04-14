// app/admin/content/[lessonId]/page.js
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ── API helpers ───────────────────────────────────────────────────────────────

async function contentRequest(method, body) {
  const res = await fetch('/api/admin/content', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `${method} failed`)
  return json.data
}

async function quizRequest(method, body) {
  const res = await fetch('/api/admin/quiz-questions', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `${method} failed`)
  return json.data
}

// ── Quiz Question Editor ──────────────────────────────────────────────────────

function QuestionEditor({ question, onUpdate, onDelete }) {
  const [form, setForm] = useState({
    type: question.type ?? 'mcq',
    question_text: question.question_text ?? '',
    options: question.options ? JSON.stringify(question.options, null, 2) : '[]',
    correct_answer: question.correct_answer ?? '',
    explanation: question.explanation ?? '',
    points: question.points ?? 1,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true); setErr(null)
    try {
      let options = null
      if (form.options.trim()) {
        try { options = JSON.parse(form.options) } catch { throw new Error('Invalid JSON in options') }
      }
      const updated = await quizRequest('PUT', {
        id: question.id,
        data: {
          type: form.type,
          question_text: form.question_text,
          options,
          correct_answer: form.correct_answer,
          explanation: form.explanation,
          points: Number(form.points),
        },
      })
      onUpdate(updated)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this question?')) return
    setSaving(true); setErr(null)
    try {
      await quizRequest('DELETE', { id: question.id })
      onDelete(question.id)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-gray-500 uppercase">Type</span>
        <select
          className="border border-gray-200 rounded px-2 py-1 text-sm"
          value={form.type}
          onChange={e => handleChange('type', e.target.value)}
        >
          <option value="mcq">MCQ</option>
          <option value="true_false">True/False</option>
          <option value="short_answer">Short Answer</option>
          <option value="fill_blank">Fill in the Blank</option>
        </select>
        <span className="text-xs text-gray-500 ml-2">Points:</span>
        <input
          type="number"
          className="border border-gray-200 rounded px-2 py-1 text-sm w-16"
          value={form.points}
          onChange={e => handleChange('points', e.target.value)}
          min={1}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Question text</label>
        <textarea
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-y"
          rows={2}
          value={form.question_text}
          onChange={e => handleChange('question_text', e.target.value)}
          placeholder="Enter question..."
        />
      </div>

      {(form.type === 'mcq' || form.type === 'true_false') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Options (JSON array)</label>
          <textarea
            className="w-full border border-gray-200 rounded px-3 py-2 text-xs font-mono resize-y"
            rows={3}
            value={form.options}
            onChange={e => handleChange('options', e.target.value)}
            placeholder='["Option A","Option B","Option C","Option D"]'
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Correct answer</label>
        <input
          className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm"
          value={form.correct_answer}
          onChange={e => handleChange('correct_answer', e.target.value)}
          placeholder="e.g. Option A or true"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Explanation</label>
        <textarea
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-y"
          rows={2}
          value={form.explanation}
          onChange={e => handleChange('explanation', e.target.value)}
          placeholder="Explain the correct answer..."
        />
      </div>

      {err && <p className="text-red-500 text-xs">{err}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Question'}
        </button>
        <button
          onClick={handleDelete}
          disabled={saving}
          className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ── Quiz Panel ────────────────────────────────────────────────────────────────

function QuizPanel({ quiz }) {
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState(null)
  const [addingQ, setAddingQ] = useState(false)

  async function load() {
    if (questions !== null) { setOpen(o => !o); return }
    setOpen(true); setLoading(true)
    try {
      const res = await fetch(`/api/admin/quiz-questions?quizId=${quiz.id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setQuestions(json.data)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  async function addQuestion() {
    setAddingQ(true); setErr(null)
    try {
      const res = await fetch('/api/admin/quiz-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.id,
          questions: [{
            type: 'mcq',
            question_text: 'New question',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct_answer: 'Option A',
            explanation: '',
            points: 1,
            order: (questions?.length ?? 0) + 1,
          }],
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setQuestions(prev => [...(prev ?? []), ...(json.data ?? [])])
      setOpen(true)
    } catch (e) { setErr(e.message) }
    setAddingQ(false)
  }

  function updateQuestion(updated) {
    setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q))
  }
  function deleteQuestion(id) {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const quizTypeLabel = {
    lesson_quiz: 'Lesson Quiz',
    topic_test: 'Topic Test',
    term_exam: 'Term Exam',
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={load}
      >
        <span className="text-gray-400 text-xs w-4 text-center">{open ? '▼' : '▶'}</span>
        <span className="font-medium text-sm text-gray-800">
          {quizTypeLabel[quiz.quiz_type] ?? quiz.quiz_type ?? 'Quiz'}
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          {questions !== null ? `${questions.length} question${questions.length !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      {open && (
        <div className="p-4 space-y-3 bg-white">
          {loading && <p className="text-xs text-gray-400">Loading questions…</p>}
          {err && <p className="text-red-500 text-xs">{err}</p>}

          {questions?.map(q => (
            <QuestionEditor
              key={q.id}
              question={q}
              onUpdate={updateQuestion}
              onDelete={deleteQuestion}
            />
          ))}

          {questions?.length === 0 && !loading && (
            <p className="text-xs text-gray-400">No questions yet.</p>
          )}

          <button
            onClick={addQuestion}
            disabled={addingQ}
            className="px-3 py-1.5 border border-green-300 text-green-700 text-xs rounded hover:bg-green-50 disabled:opacity-50"
          >
            {addingQ ? 'Adding…' : '+ Add Question'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Section Editor ────────────────────────────────────────────────────────────

function SectionEditor({ section, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [form, setForm] = useState({
    type: section.type ?? 'video',
    content_url: section.content_url ?? '',
    cloudflare_video_id: section.cloudflare_video_id ?? '',
    slides_data: section.slides_data ? JSON.stringify(section.slides_data, null, 2) : '{}',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true); setErr(null)
    try {
      let slides_data = null
      if (form.type === 'slides' && form.slides_data.trim()) {
        try { slides_data = JSON.parse(form.slides_data) } catch { throw new Error('Invalid JSON in slides_data') }
      }
      const updated = await contentRequest('PUT', {
        entity: 'sections',
        id: section.id,
        data: {
          type: form.type,
          content_url: form.content_url || null,
          cloudflare_video_id: form.type === 'video' ? (form.cloudflare_video_id || null) : null,
          slides_data,
        },
      })
      onUpdate(updated)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this section?')) return
    setSaving(true); setErr(null)
    try {
      await contentRequest('DELETE', { entity: 'sections', id: section.id })
      onDelete(section.id)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-mono">#{index + 1}</span>
        <select
          className="border border-gray-200 rounded px-2 py-1 text-sm"
          value={form.type}
          onChange={e => handleChange('type', e.target.value)}
        >
          <option value="video">Video</option>
          <option value="slides">Slides</option>
        </select>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0 || saving}
            className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1 || saving}
            className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      </div>

      {form.type === 'video' && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cloudflare Stream Video ID</label>
            <input
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm font-mono"
              value={form.cloudflare_video_id}
              onChange={e => handleChange('cloudflare_video_id', e.target.value)}
              placeholder="e.g. abc123def456..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Content URL (optional)</label>
            <input
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm"
              value={form.content_url}
              onChange={e => handleChange('content_url', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      )}

      {form.type === 'slides' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Slides data (JSON)</label>
          <textarea
            className="w-full border border-gray-200 rounded px-3 py-2 text-xs font-mono resize-y"
            rows={6}
            value={form.slides_data}
            onChange={e => handleChange('slides_data', e.target.value)}
            placeholder='{"slides": [...]}'
          />
        </div>
      )}

      {err && <p className="text-red-500 text-xs">{err}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Section'}
        </button>
        <button
          onClick={handleDelete}
          disabled={saving}
          className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LessonEditorPage() {
  const { lessonId } = useParams()
  const router = useRouter()

  const [lesson, setLesson] = useState(null)
  const [sections, setSections] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  // Lesson form state
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', status: 'draft' })
  const [savingLesson, setSavingLesson] = useState(false)
  const [lessonErr, setLessonErr] = useState(null)
  const [lessonSaved, setLessonSaved] = useState(false)

  // Add section state
  const [addingSection, setAddingSection] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Load lesson
        const { data: lessonData, error: lessonErr } = await supabase
          .from('lessons_new')
          .select('*')
          .eq('id', lessonId)
          .single()
        if (lessonErr) throw lessonErr
        setLesson(lessonData)
        setLessonForm({
          title: lessonData.title ?? '',
          description: lessonData.description ?? '',
          status: lessonData.status ?? 'draft',
        })

        // Load sections
        const sectionsRes = await fetch(`/api/admin/content?entity=sections&lessonId=${lessonId}`)
        const sectionsJson = await sectionsRes.json()
        setSections(sectionsJson.data ?? [])

        // Load quizzes for this lesson
        const { data: quizzesData } = await supabase
          .from('quizzes')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('order', { ascending: true })
        setQuizzes(quizzesData ?? [])

      } catch (e) {
        setErr(e.message)
      }
      setLoading(false)
    }
    load()
  }, [lessonId])

  async function saveLesson() {
    setSavingLesson(true); setLessonErr(null); setLessonSaved(false)
    try {
      const updated = await contentRequest('PUT', {
        entity: 'lessons',
        id: lessonId,
        data: {
          title: lessonForm.title,
          description: lessonForm.description,
          status: lessonForm.status,
        },
      })
      setLesson(updated)
      setLessonSaved(true)
      setTimeout(() => setLessonSaved(false), 2000)
    } catch (e) { setLessonErr(e.message) }
    setSavingLesson(false)
  }

  async function addSection(type) {
    setAddingSection(true)
    try {
      const next = await contentRequest('POST', {
        entity: 'sections',
        data: {
          lesson_id: lessonId,
          type,
          order: sections.length + 1,
          content_url: null,
          cloudflare_video_id: null,
          slides_data: type === 'slides' ? {} : null,
        },
      })
      setSections(prev => [...prev, next])
    } catch (e) { setErr(e.message) }
    setAddingSection(false)
  }

  function updateSection(updated) {
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  function deleteSection(id) {
    setSections(prev => {
      const filtered = prev.filter(s => s.id !== id)
      // Re-assign order
      return filtered.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  async function moveSection(index, direction) {
    const newSections = [...sections]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newSections.length) return
    ;[newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]

    // Update orders
    const updates = newSections.map((s, i) => ({ ...s, order: i + 1 }))
    setSections(updates)

    // Persist both swapped sections
    try {
      await Promise.all([
        contentRequest('PUT', { entity: 'sections', id: updates[index].id, data: { order: updates[index].order } }),
        contentRequest('PUT', { entity: 'sections', id: updates[targetIndex].id, data: { order: updates[targetIndex].order } }),
      ])
    } catch (e) { setErr(e.message) }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-6 w-64 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (err) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">{err}</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/content')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Lesson Editor</h1>
          <p className="text-sm text-gray-400">{lesson?.title}</p>
        </div>
      </div>

      {/* ── Lesson Details ── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Lesson Details</h2>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={lessonForm.title}
            onChange={e => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={lessonForm.description}
            onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this lesson..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={lessonForm.status}
            onChange={e => setLessonForm(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
        </div>

        {lessonErr && <p className="text-red-500 text-sm">{lessonErr}</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={saveLesson}
            disabled={savingLesson}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {savingLesson ? 'Saving…' : 'Save Details'}
          </button>
          {lessonSaved && <span className="text-green-600 text-sm">Saved!</span>}
        </div>
      </section>

      {/* ── Sections ── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Sections</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => addSection('video')}
              disabled={addingSection}
              className="px-3 py-1.5 border border-blue-200 text-blue-700 text-xs rounded hover:bg-blue-50 disabled:opacity-50"
            >
              + Video
            </button>
            <button
              onClick={() => addSection('slides')}
              disabled={addingSection}
              className="px-3 py-1.5 border border-purple-200 text-purple-700 text-xs rounded hover:bg-purple-50 disabled:opacity-50"
            >
              + Slides
            </button>
          </div>
        </div>

        {sections.length === 0 && (
          <p className="text-sm text-gray-400">No sections yet. Add a video or slides section above.</p>
        )}

        <div className="space-y-3">
          {sections.map((section, i) => (
            <SectionEditor
              key={section.id}
              section={section}
              index={i}
              total={sections.length}
              onUpdate={updateSection}
              onDelete={deleteSection}
              onMoveUp={() => moveSection(i, -1)}
              onMoveDown={() => moveSection(i, 1)}
            />
          ))}
        </div>
      </section>

      {/* ── Quizzes ── */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Quizzes</h2>

        {quizzes.length === 0 && (
          <p className="text-sm text-gray-400">No quizzes linked to this lesson.</p>
        )}

        <div className="space-y-3">
          {quizzes.map(quiz => (
            <QuizPanel key={quiz.id} quiz={quiz} />
          ))}
        </div>
      </section>
    </div>
  )
}
