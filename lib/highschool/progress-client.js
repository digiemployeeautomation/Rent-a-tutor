// lib/highschool/progress-client.js
//
// CLIENT-ONLY. High-school lesson progress.
//   - Signed-in students: saved to the database through /api/hs/progress.
//   - Guests and offline use: kept in localStorage on the device.
// Both are always written, so a lesson finished offline still shows as done.
//
// Shape: { [lessonId]: { score, total, passed, completedAt } }

const KEY = 'rat.hs.progress.v1'

function readLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function writeLocal(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)) } catch {}
}

function better(a, b) {
  if (!a) return b
  if (!b) return a
  return (b.score ?? 0) > (a.score ?? 0) ? b : a
}

export async function loadProgress() {
  const local = readLocal()
  try {
    const res = await fetch('/api/hs/progress', { cache: 'no-store' })
    if (!res.ok) return local
    const { items } = await res.json()
    const merged = { ...local }
    for (const [id, row] of Object.entries(items || {})) merged[id] = better(local[id], row)
    writeLocal(merged)
    return merged
  } catch {
    return local
  }
}

export async function saveProgress(lessonId, score, total) {
  const local = readLocal()
  const entry = better(local[lessonId], {
    score, total, passed: total > 0 && score / total >= 0.6, completedAt: new Date().toISOString(),
  })
  local[lessonId] = entry
  writeLocal(local)
  try {
    await fetch('/api/hs/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, score, total }),
    })
  } catch {}
  return entry
}
