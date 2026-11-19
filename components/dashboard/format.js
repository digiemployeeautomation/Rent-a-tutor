// components/dashboard/format.js — small display helpers for the dashboard.

const DAY = 86_400_000

export function relativeTime(iso, now = Date.now()) {
  if (!iso) return ''
  const diff = now - new Date(iso).getTime()
  if (diff < 60_000) return 'Just now'
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(diff / DAY)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// test_date is a plain DATE ("2027-01-28"); read it as UTC so it never shifts a day.
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function daysUntil(dateStr, now = Date.now()) {
  if (!dateStr) return null
  return Math.ceil((new Date(`${dateStr}T00:00:00Z`).getTime() - now) / DAY)
}

export function band(n) {
  return n == null ? null : Number(n).toFixed(1)
}
