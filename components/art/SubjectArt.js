// components/art/SubjectArt.js
//
// The illustration set: one small two-colour drawing per subject and per IELTS
// skill. Use these instead of an icon in a rounded tile. They are drawn on a
// 96 x 96 grid with a 2.5 outline, one flat fill and one "pop" colour.
//
//   <SubjectArt name="mathematics" className="h-16 w-16" />
//   <SubjectArt name="reading" tone="copper" />
//   <SubjectArt name="physics" tone="chalk" />   (on the dark chalkboard)
//
// Names: mathematics, biology, chemistry, physics, english-language,
//        listening, reading, writing, speaking, offline, quiz

const TONES = {
  // outline, flat fill, pop, paper
  board: { line: '#0F1713', fill: '#C2E7D2', pop: '#D27534', paper: '#FEFEFC' },
  copper: { line: '#0F1713', fill: '#FDD0B6', pop: '#1A6B48', paper: '#FEFEFC' },
  chalk: { line: '#F8F7EE', fill: '#1A6B48', pop: '#FCC82C', paper: '#0B3E28' },
}

const ALIASES = { calculator: 'mathematics', dna: 'biology', flask: 'chemistry', atom: 'physics', pen: 'english-language', english: 'english-language', maths: 'mathematics' }

function Drawing({ name, c }) {
  const s = { fill: 'none', stroke: c.line, strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const pop = { ...s, stroke: c.pop, strokeWidth: 3.5 }
  switch (name) {
    case 'mathematics':
      return (
        <>
          <path d="M40 54V26a28 28 0 0 1 28 28Z" fill={c.fill} />
          <circle cx="40" cy="54" r="28" {...s} />
          <path d="M12 54h56M40 26v56" {...s} />
          <path d="M70 20h16M78 12v16" {...pop} />
        </>
      )
    case 'biology':
      return (
        <>
          <path d="M16 80C16 42 42 18 80 16c0 36-22 64-64 64Z" fill={c.fill} {...{ stroke: c.line, strokeWidth: 2.5, strokeLinejoin: 'round' }} />
          <path d="M16 80C34 62 56 40 80 16M35 61l2-18M35 61l19 1M51 45l2-16M51 45l17 1" {...s} />
          <circle cx="76" cy="74" r="10" fill={c.paper} stroke={c.line} strokeWidth="2.5" />
          <circle cx="78" cy="72" r="3.5" fill={c.pop} />
        </>
      )
    case 'chemistry':
      return (
        <>
          <path d="M32.5 58h31l9 16.5a5 5 0 0 1-4.4 7.5H27.9a5 5 0 0 1-4.4-7.5Z" fill={c.fill} />
          <path d="M36 14h24M41 14v24L22.5 74.5a5 5 0 0 0 4.4 7.5h42.2a5 5 0 0 0 4.4-7.5L55 38V14" {...s} />
          <path d="M32.5 58h31" {...s} />
          <circle cx="44" cy="70" r="3" {...s} />
          <circle cx="55" cy="66" r="2" {...s} />
          <circle cx="72" cy="24" r="4.5" fill={c.pop} />
          <circle cx="82" cy="12" r="2.5" fill={c.pop} />
        </>
      )
    case 'physics':
      return (
        <>
          <path d="M18 14h60" {...s} strokeWidth="3.5" />
          <path d="M48 14 23 54" {...s} strokeDasharray="1 6" />
          <circle cx="19" cy="61" r="8" {...s} strokeDasharray="1 5.5" />
          <path d="M48 14v46" {...s} />
          <circle cx="48" cy="69" r="10" fill={c.fill} stroke={c.line} strokeWidth="2.5" />
          <path d="M30 84q24 8 44-8" {...pop} />
          <path d="m66 74 9 1.5-2 9" {...pop} />
        </>
      )
    case 'english-language':
      return (
        <>
          <rect x="16" y="12" width="50" height="70" rx="4" fill={c.paper} stroke={c.line} strokeWidth="2.5" />
          <rect x="25" y="44" width="26" height="9" fill={c.fill} />
          <path d="M26 26h30M26 36h30M26 48h24M26 60h30M26 70h14" {...s} />
          <path d="M60 82V70a11 11 0 0 1 11-11v6a5 5 0 0 0-5 5h5v12ZM76 82V70a11 11 0 0 1 11-11v6a5 5 0 0 0-5 5h5v12Z" fill={c.pop} stroke={c.paper} strokeWidth="2" strokeLinejoin="round" />
        </>
      )
    case 'listening':
      return (
        <>
          <path d="M22 58V46a26 26 0 0 1 52 0v12" {...s} />
          <rect x="14" y="54" width="16" height="26" rx="6" fill={c.fill} stroke={c.line} strokeWidth="2.5" />
          <rect x="66" y="54" width="16" height="26" rx="6" fill={c.fill} stroke={c.line} strokeWidth="2.5" />
          <path d="M41 70v8M48 60v18M55 66v12" {...pop} />
        </>
      )
    case 'reading':
      return (
        <>
          <path d="M48 28c-8-6-22-8-34-4v48c12-4 26-2 34 4Z" fill={c.fill} stroke={c.line} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M48 28c8-6 22-8 34-4v48c-12-4-26-2-34 4Z" fill={c.paper} stroke={c.line} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M56 38c6-3 12-4 18-3.5M56 48c6-3 12-4 18-3.5M56 58c5-2.5 9-3.3 13-3.3" {...s} />
          <path d="M62 14v20l5-4 5 4V15" fill={c.pop} stroke={c.pop} strokeWidth="1.5" strokeLinejoin="round" />
        </>
      )
    case 'writing':
      return (
        <>
          <rect x="14" y="14" width="48" height="66" rx="4" fill={c.paper} stroke={c.line} strokeWidth="2.5" />
          <path d="M24 28h28M24 38h28M24 48h16" {...s} />
          <path d="m44 84 4-15 28-34 10 8-28 34Z" fill={c.fill} stroke={c.line} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="m44 84 4-15 10 8Z" fill={c.pop} stroke={c.line} strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )
    case 'speaking':
      return (
        <>
          <path d="M18 18h60a6 6 0 0 1 6 6v34a6 6 0 0 1-6 6H46L30 80V64H18a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6Z" fill={c.fill} stroke={c.line} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M28 38v6M38 33v16M58 35v12M68 38v6" {...s} />
          <path d="M48 28v26" {...pop} />
        </>
      )
    case 'offline':
      return (
        <>
          <rect x="27" y="8" width="42" height="80" rx="8" fill={c.paper} stroke={c.line} strokeWidth="2.5" />
          <rect x="34" y="18" width="28" height="34" rx="2" fill={c.fill} />
          <path d="M43 80h10" {...s} />
          <path d="M48 26v20M40 39l8 8 8-8" {...pop} />
          <path d="M38 62h20M38 70h12" {...s} />
        </>
      )
    case 'quiz':
    default:
      return (
        <>
          <rect x="16" y="12" width="64" height="72" rx="5" fill={c.paper} stroke={c.line} strokeWidth="2.5" />
          <rect x="26" y="24" width="12" height="12" rx="2" fill={c.fill} stroke={c.line} strokeWidth="2.5" />
          <rect x="26" y="44" width="12" height="12" rx="2" {...s} />
          <rect x="26" y="64" width="12" height="12" rx="2" {...s} />
          <path d="M46 30h24M46 50h24M46 70h16" {...s} />
          <path d="m27 49 5 5 10-13" {...pop} />
        </>
      )
  }
}

export default function SubjectArt({ name, tone = 'board', className = 'h-16 w-16', title }) {
  const key = ALIASES[name] || name
  const c = TONES[tone] || TONES.board
  return (
    <svg viewBox="0 0 96 96" className={`shrink-0 ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : 'true'}>
      <Drawing name={key} c={c} />
    </svg>
  )
}
