'use client'

import Link from 'next/link'

const ILLUSTRATIONS = {
  lessons: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <rect x="25" y="30" width="70" height="55" rx="8" fill="var(--color-surface)" stroke="var(--color-primary-lit)" strokeWidth="2"/>
      <path d="M45 55 L60 65 L75 55" stroke="var(--color-primary-mid)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="60" cy="55" r="8" fill="var(--color-accent-lit)" opacity="0.6"/>
      <rect x="40" y="75" width="40" height="4" rx="2" fill="var(--color-surface-mid)" opacity="0.5"/>
      <rect x="48" y="82" width="24" height="3" rx="1.5" fill="var(--color-surface-mid)" opacity="0.3"/>
    </svg>
  ),
  tutors: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="45" r="18" fill="var(--color-surface)" stroke="var(--color-primary-lit)" strokeWidth="2"/>
      <circle cx="60" cy="41" r="7" fill="var(--color-primary-mid)" opacity="0.5"/>
      <path d="M45 56 C45 56 50 68 60 68 C70 68 75 56 75 56" fill="var(--color-surface)" stroke="var(--color-primary-lit)" strokeWidth="2"/>
      <rect x="35" y="75" width="50" height="15" rx="7.5" fill="var(--color-surface)" stroke="var(--color-primary-lit)" strokeWidth="2"/>
      <circle cx="40" cy="35" r="5" fill="var(--color-accent-lit)" opacity="0.4"/>
      <circle cx="82" cy="40" r="4" fill="var(--color-accent-lit)" opacity="0.3"/>
    </svg>
  ),
  sessions: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <rect x="30" y="25" width="60" height="65" rx="8" fill="var(--color-surface)" stroke="var(--color-primary-lit)" strokeWidth="2"/>
      <rect x="30" y="25" width="60" height="18" rx="8" fill="var(--color-primary-mid)" opacity="0.2"/>
      <line x1="50" y1="25" x2="50" y2="18" stroke="var(--color-primary-lit)" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="70" y1="25" x2="70" y2="18" stroke="var(--color-primary-lit)" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="40" y="52" width="10" height="10" rx="2" fill="var(--color-accent-lit)" opacity="0.5"/>
      <rect x="55" y="52" width="10" height="10" rx="2" fill="var(--color-surface-mid)" opacity="0.4"/>
      <rect x="70" y="52" width="10" height="10" rx="2" fill="var(--color-surface-mid)" opacity="0.4"/>
      <rect x="40" y="67" width="10" height="10" rx="2" fill="var(--color-surface-mid)" opacity="0.4"/>
      <rect x="55" y="67" width="10" height="10" rx="2" fill="var(--color-accent-lit)" opacity="0.3"/>
    </svg>
  ),
  purchases: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <path d="M35 40 L45 35 L85 35 L85 80 L45 80 L35 75 Z" fill="var(--color-surface)" stroke="var(--color-primary-lit)" strokeWidth="2"/>
      <circle cx="65" cy="57" r="12" fill="var(--color-accent-lit)" opacity="0.4"/>
      <path d="M62 54 L62 61 L68 61" stroke="var(--color-primary-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="50" y="72" width="20" height="3" rx="1.5" fill="var(--color-surface-mid)" opacity="0.5"/>
    </svg>
  ),
  search: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="55" cy="52" r="22" fill="var(--color-surface)" stroke="var(--color-primary-lit)" strokeWidth="2.5"/>
      <line x1="71" y1="68" x2="85" y2="82" stroke="var(--color-primary-mid)" strokeWidth="3" strokeLinecap="round"/>
      <path d="M46 52 L55 47 L64 52" stroke="var(--color-accent-lit)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="55" cy="55" r="4" fill="var(--color-accent-lit)" opacity="0.4"/>
    </svg>
  ),
}

export function EmptyState({
  type = 'lessons',
  title,
  description,
  actionLabel,
  actionHref,
}) {
  const illustration = ILLUSTRATIONS[type] ?? ILLUSTRATIONS.lessons

  return (
    <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
      <div className="flex justify-center mb-5 opacity-80">{illustration}</div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      {description && <p className="text-xs text-gray-400 mb-5">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref}
          className="inline-block text-xs px-5 py-2.5 rounded-lg font-medium"
          style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
