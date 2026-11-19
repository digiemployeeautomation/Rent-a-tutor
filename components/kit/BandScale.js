// components/kit/BandScale.js
//
// The IELTS band ruler: shows a band score (and optionally the student's
// target) on the real 4-9 scale, so a number like 6.5 means something.
//
//   <BandScale band={6.5} target={7} />
//   <BandScale band={null} target={7} />        (no score yet: only the target)
//   <BandScale band={6} tone="chalk" />          (on the chalkboard)

const MIN = 4
const MAX = 9

function pos(v) {
  const clamped = Math.max(MIN, Math.min(MAX, Number(v)))
  return ((clamped - MIN) / (MAX - MIN)) * 100
}

export default function BandScale({ band, target, tone = 'paper', className = '' }) {
  const onBoard = tone === 'chalk'
  const line = onBoard ? 'bg-chalk/25' : 'bg-ink-300'
  const tick = onBoard ? 'bg-chalk/40' : 'bg-ink-300'
  const num = onBoard ? 'text-chalk/70' : 'text-ink-500'
  const hasBand = band !== null && band !== undefined && !Number.isNaN(Number(band))
  const hasTarget = target !== null && target !== undefined && !Number.isNaN(Number(target))
  const label = [hasBand ? `Band ${Number(band).toFixed(1)}` : 'No band score yet', hasTarget ? `target ${Number(target).toFixed(1)}` : null].filter(Boolean).join(', ')

  return (
    <div className={`select-none ${className}`} role="img" aria-label={`IELTS band scale from 4 to 9. ${label}.`}>
      <div className="relative mx-2 h-9">
        {hasTarget ? (
          <span className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${pos(target)}%` }}>
            <span className={`block whitespace-nowrap text-[11px] font-bold leading-4 ${onBoard ? 'text-sun-300' : 'text-copper-700'}`}>Target</span>
            <span className={`mx-auto block h-5 w-px ${onBoard ? 'bg-sun-300' : 'bg-copper-600'}`} />
          </span>
        ) : null}
        {hasBand ? (
          <span
            className={`absolute bottom-[-7px] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 ${onBoard ? 'border-board-900 bg-chalk' : 'border-white bg-ink-900'}`}
            style={{ left: `${pos(band)}%`, height: 14, width: 14 }}
          />
        ) : null}
      </div>
      <div className={`relative mx-2 h-px ${line}`}>
        {hasBand ? <span className={`absolute left-0 top-[-1px] h-[3px] rounded-full ${onBoard ? 'bg-chalk' : 'bg-ink-900'}`} style={{ width: `${pos(band)}%` }} /> : null}
        {Array.from({ length: (MAX - MIN) * 2 + 1 }, (_, i) => (
          <span key={i} className={`absolute top-0 w-px ${tick} ${i % 2 === 0 ? 'h-2' : 'h-1'}`} style={{ left: `${(i / ((MAX - MIN) * 2)) * 100}%` }} />
        ))}
      </div>
      <div className={`relative mx-2 mt-2.5 h-4 text-[11px] font-semibold tabular ${num}`} style={{ marginTop: 10 }}>
        {Array.from({ length: MAX - MIN + 1 }, (_, i) => (
          <span key={i} className="absolute -translate-x-1/2" style={{ left: `${(i / (MAX - MIN)) * 100}%` }}>{MIN + i}</span>
        ))}
      </div>
    </div>
  )
}
