// components/art/ChalkDoodles.js
//
// Faint chalk sketches for the background of a `.board` panel. Decorative only.
// Place it as the first child of the board; it pins itself to the right edge.
//
//   <div className="board p-8"><ChalkDoodles /> ...content... </div>
//
// `variant`: 'maths' (default) | 'science' | 'language'
// The roughness comes from an SVG displacement filter, so the lines look hand
// drawn without shipping an image.

const SETS = {
  maths: (
    <>
      {/* right-angled triangle with its square corner */}
      <path d="M40 210 L40 70 L190 210 Z" />
      <path d="M40 190 H60 V210" />
      {/* fraction circle */}
      <circle cx="285" cy="95" r="52" />
      <path d="M285 43 V147 M233 95 H337 M248 58 L322 132" />
      {/* number line */}
      <path d="M215 220 H400 M235 212 V228 M275 212 V228 M315 212 V228 M355 212 V228 M395 212 V228" />
      <path d="M275 205 q20 -26 40 0" />
      {/* a tick, like a marked answer */}
      <path d="M108 52 l14 16 l30 -40" />
    </>
  ),
  science: (
    <>
      {/* wave on axes */}
      <path d="M30 60 V210 H230" />
      <path d="M30 135 q25 -70 50 0 t50 0 t50 0 t50 0" />
      {/* atom */}
      <ellipse cx="315" cy="86" rx="64" ry="23" />
      <ellipse cx="315" cy="86" rx="64" ry="23" transform="rotate(60 315 86)" />
      <ellipse cx="315" cy="86" rx="64" ry="23" transform="rotate(120 315 86)" />
      <circle cx="315" cy="86" r="7" />
      {/* beaker */}
      <path d="M282 184 V240 H348 V184 M274 184 H356 M282 212 H348" />
    </>
  ),
  language: (
    <>
      {/* ruled lines of writing */}
      <path d="M40 70 H230 M40 100 H210 M40 130 H230 M40 160 H150" />
      {/* quotation marks */}
      <path d="M270 110 q0 -40 34 -46 M320 110 q0 -40 34 -46" />
      <path d="M262 110 h22 v22 h-22 Z M312 110 h22 v22 h-22 Z" />
      {/* band scale */}
      <path d="M250 205 H400 M250 196 V214 M287 199 V211 M325 196 V214 M362 199 V211 M400 196 V214" />
      <path d="M60 205 l14 16 l30 -40" />
    </>
  ),
}

export default function ChalkDoodles({ variant = 'maths', className = '', opacity = 0.16 }) {
  const id = `chalk-${variant}`
  return (
    <svg
      viewBox="0 0 420 260"
      aria-hidden="true"
      className={`pointer-events-none absolute -right-6 top-1/2 -z-10 hidden h-[125%] max-h-[420px] -translate-y-1/2 sm:block ${className}`}
      style={{ opacity }}
    >
      <defs>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} fill="none" stroke="#F8F7EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {SETS[variant] || SETS.maths}
      </g>
    </svg>
  )
}
