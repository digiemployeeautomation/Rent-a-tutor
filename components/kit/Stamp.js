// components/kit/Stamp.js
//
// A rubber stamp, the way a teacher marks a finished exercise. Use ONCE on a
// result screen, next to the score. Decorative: always pair it with real text
// that says the same thing.
//
//   <Stamp word="Passed" />
//   <Stamp word="Try again" tone="copper" />
//   <Stamp word="Band 6.5" tone="copper" ring="IELTS practice" />

const TONES = { board: '#0F5337', copper: '#B05C1F', ink: '#2F3A33' }

export default function Stamp({ word = 'Passed', tone = 'board', ring = 'Rent a Tutor', className = 'h-28 w-28', animate = true }) {
  const color = TONES[tone] || TONES.board
  const text = ring.toUpperCase()
  const size = word.length > 8 ? 13.5 : word.length > 6 ? 16 : 21
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={`shrink-0 ${animate ? 'animate-stamp' : '-rotate-[9deg]'} ${className}`} style={{ color }}>
      <defs>
        <path id="stamp-ring" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text fill="currentColor" fontSize="8.5" fontWeight="700" letterSpacing="1.8" textAnchor="middle" style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
        <textPath href="#stamp-ring" startOffset="25%">{text}</textPath>
      </text>
      <path d="M44 99.5h.01M52 102.2h.01M60 103.2h.01M68 102.2h.01M76 99.5h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <rect x="6" y="44" width="108" height="32" rx="3" fill="#FEFEFC" stroke="currentColor" strokeWidth="3" />
      <text x="60" y="67" textAnchor="middle" fill="currentColor" fontSize={size} fontWeight="800" letterSpacing="1" style={{ fontFamily: 'var(--font-display), Georgia, serif', textTransform: 'uppercase' }}>
        {word.toUpperCase()}
      </text>
    </svg>
  )
}
