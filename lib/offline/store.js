// lib/offline/store.js
//
// CLIENT-ONLY. The offline lesson library: full lesson JSON kept on the device.
//   - IndexedDB (database "rat-offline", store "lessons") when available.
//   - localStorage fallback for browsers / private modes without IndexedDB.
// Nothing here touches the network, so the Downloads page works with no data.
//
// Record shape:
//   { id, course, subject, topic, topicSlug, order, form, term, title, minutes,
//     slug, savedAt, bytes, lesson }

const DB_NAME = 'rat-offline'
const DB_VERSION = 1
const STORE = 'lessons'
const LS_KEY = 'rat.offline.lessons.v1'
const EVENT = 'rat:offline-changed'

export class OfflineStorageError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'OfflineStorageError'
    this.code = code // 'full' | 'unavailable' | 'invalid'
  }
}

function isQuotaError(err) {
  return !!err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22)
}

// A lesson's stable id. High-school lessons always have one; this keeps
// other sources (IELTS reading) safe if theirs is missing.
export function lessonId(lesson) {
  if (!lesson) return null
  if (lesson.id) return String(lesson.id)
  if (lesson.slug) return `${lesson.subject || lesson.course || 'lesson'}-${lesson.slug}`
  return null
}

export function toRecord(lesson, now = new Date()) {
  const id = lessonId(lesson)
  if (!id || !Array.isArray(lesson?.sections)) {
    throw new OfflineStorageError('invalid', 'This lesson cannot be saved.')
  }
  const full = { ...lesson, id, course: lesson.course || 'highschool' }
  let bytes = 0
  try { bytes = new Blob([JSON.stringify(full)]).size } catch { bytes = JSON.stringify(full).length }
  return {
    id,
    course: full.course,
    subject: full.subject || '',
    topic: full.topic || '',
    topicSlug: full.topicSlug || '',
    order: full.order ?? 0,
    form: full.form ?? null,
    term: full.term ?? null,
    title: full.title || 'Lesson',
    minutes: full.minutes ?? null,
    slug: full.slug || null,
    savedAt: now.toISOString(),
    bytes,
    lesson: full,
  }
}

// ── IndexedDB ───────────────────────────────────────────────────────────────

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    let req
    try {
      if (typeof indexedDB === 'undefined' || !indexedDB) throw new Error('no indexedDB')
      req = indexedDB.open(DB_NAME, DB_VERSION)
    } catch (err) {
      reject(err)
      return
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => {
      const db = req.result
      db.onversionchange = () => { db.close(); dbPromise = null }
      resolve(db)
    }
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('blocked'))
  })
  dbPromise.catch(() => { dbPromise = null })
  return dbPromise
}

function idb(mode, work) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const result = work(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(result?.result)
    tx.onabort = () => reject(tx.error || new Error('aborted'))
    tx.onerror = () => reject(tx.error)
  }))
}

// ── localStorage fallback ───────────────────────────────────────────────────

function lsRead() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {} } catch { return {} }
}

function lsWrite(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map))
}

// Decide once per page which backend works.
let backendPromise = null

function backend() {
  if (!backendPromise) {
    backendPromise = openDb().then(() => 'idb').catch(() => {
      try {
        localStorage.setItem(`${LS_KEY}.probe`, '1')
        localStorage.removeItem(`${LS_KEY}.probe`)
        return 'ls'
      } catch {
        return 'none'
      }
    })
  }
  return backendPromise
}

// ── Change notifications (same tab + other tabs) ────────────────────────────

let channel = null

function getChannel() {
  if (channel || typeof BroadcastChannel === 'undefined') return channel
  try { channel = new BroadcastChannel('rat-offline') } catch { channel = null }
  return channel
}

function notify() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENT))
  try { getChannel()?.postMessage('changed') } catch {}
}

// Calls `fn` whenever the library changes. Returns an unsubscribe function.
export function subscribe(fn) {
  if (typeof window === 'undefined') return () => {}
  const ch = getChannel()
  const onMessage = () => fn()
  window.addEventListener(EVENT, fn)
  ch?.addEventListener('message', onMessage)
  return () => {
    window.removeEventListener(EVENT, fn)
    ch?.removeEventListener('message', onMessage)
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

async function putRecords(records) {
  const kind = await backend()
  if (kind === 'none') throw new OfflineStorageError('unavailable', 'This browser does not allow saving lessons (private mode?).')
  try {
    if (kind === 'idb') {
      await idb('readwrite', (store) => { for (const r of records) store.put(r) })
    } else {
      const map = lsRead()
      for (const r of records) map[r.id] = r
      lsWrite(map)
    }
  } catch (err) {
    if (isQuotaError(err)) throw new OfflineStorageError('full', 'This device is out of space. Remove some saved lessons and try again.')
    throw new OfflineStorageError('unavailable', 'The lesson could not be saved on this device.')
  }
  // Ask the browser not to clear saved lessons when the device runs low on space.
  try { navigator.storage?.persist?.().catch(() => {}) } catch {}
}

export async function saveLesson(lesson) {
  const record = toRecord(lesson)
  await putRecords([record])
  notify()
  return record
}

// Save several lessons; `onProgress(done, total)` is called after each one.
export async function saveLessons(lessons, onProgress) {
  const total = lessons.length
  let done = 0
  for (const lesson of lessons) {
    await putRecords([toRecord(lesson)])
    done += 1
    onProgress?.(done, total)
  }
  notify()
  return done
}

export async function removeLesson(id) {
  const kind = await backend()
  if (kind === 'idb') {
    await idb('readwrite', (store) => store.delete(String(id)))
  } else if (kind === 'ls') {
    const map = lsRead()
    delete map[String(id)]
    try { lsWrite(map) } catch {}
  }
  notify()
}

export async function getSavedLesson(id) {
  if (id == null) return null
  const kind = await backend()
  if (kind === 'idb') return (await idb('readonly', (store) => store.get(String(id)))) || null
  if (kind === 'ls') return lsRead()[String(id)] || null
  return null
}

export async function isSaved(id) {
  return !!(await getSavedLesson(id))
}

// Every saved record, in course / subject / topic / lesson order.
export async function listSaved() {
  const kind = await backend()
  let records = []
  if (kind === 'idb') records = (await idb('readonly', (store) => store.getAll())) || []
  else if (kind === 'ls') records = Object.values(lsRead())
  return records.sort((a, b) =>
    String(a.course).localeCompare(String(b.course)) ||
    String(a.subject).localeCompare(String(b.subject)) ||
    String(a.topicSlug).localeCompare(String(b.topicSlug)) ||
    (a.order ?? 0) - (b.order ?? 0) ||
    String(a.title).localeCompare(String(b.title))
  )
}

// ── Pure helpers (also used by tests) ───────────────────────────────────────

export function formatBytes(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function prettySlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((w) => (w.toLowerCase() === 'ielts' ? 'IELTS' : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

export const COURSES = {
  highschool: { name: 'High School', chip: 'chip-blue' },
  ielts: { name: 'IELTS', chip: 'chip-teal' },
}

// records -> [{ course, name, chip, groups: [{ key, subject, topic, form, term, records }] }]
export function groupSaved(records) {
  const courses = []
  for (const r of records) {
    const courseKey = r.course || 'highschool'
    let course = courses.find((c) => c.course === courseKey)
    if (!course) {
      const meta = COURSES[courseKey] || { name: prettySlug(courseKey), chip: 'chip' }
      course = { course: courseKey, ...meta, groups: [] }
      courses.push(course)
    }
    const key = `${r.subject}/${r.topicSlug || r.topic}`
    let group = course.groups.find((g) => g.key === key)
    if (!group) {
      group = { key, subject: r.subject, topic: r.topic, form: r.form, term: r.term, records: [] }
      course.groups.push(group)
    }
    group.records.push(r)
  }
  const rank = (c) => (c.course === 'highschool' ? 0 : c.course === 'ielts' ? 1 : 2)
  return courses.sort((a, b) => rank(a) - rank(b))
}
