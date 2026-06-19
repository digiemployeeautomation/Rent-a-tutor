// lib/ielts/exam-timer.js
//
// Pure helpers for the timed-exam countdown. Kept out of the React component so
// the time math is unit-testable. The caller passes the current time in (no
// Date.now() here) so results are deterministic.

// Seconds remaining given when the clock started (ms), the limit (seconds), and
// "now" (ms). Never negative.
export function computeRemaining(startedAtMs, limitSeconds, nowMs) {
  const elapsed = Math.floor((nowMs - startedAtMs) / 1000)
  return Math.max(0, limitSeconds - elapsed)
}

// Format a second count as mm:ss (supports >59 minutes; clamps negatives).
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

// Proportional time limit: ~1.5 min (90s) per question.
export function proportionalLimit(questionCount, perQuestionSeconds = 90) {
  const n = Math.max(0, Math.floor(questionCount) || 0)
  return n * perQuestionSeconds
}
