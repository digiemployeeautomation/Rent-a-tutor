'use client'
import { useEffect, useState } from 'react'
import { loadProgress } from '@/lib/highschool/progress-client'

// Returns { progress, ready }. progress = { [lessonId]: { score, total, passed } }
export default function useProgress() {
  const [progress, setProgress] = useState({})
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    loadProgress().then((p) => { if (alive) { setProgress(p); setReady(true) } })
    return () => { alive = false }
  }, [])
  return { progress, ready }
}
