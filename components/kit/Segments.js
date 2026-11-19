// components/kit/Segments.js
//
// Segmented progress: one short bar per lesson or step, so "2 of 3" is visible
// at a glance. Use for small counts (up to about 16); for long or percentage
// progress use the `progress-track` / `progress-fill` classes.
//
//   <Segments total={3} done={2} />
//   <Segments total={5} done={1} tone="copper" />
//   <Segments total={3} done={1} tone="chalk" />   (on the chalkboard)

const TONES = {
  board: { on: 'bg-board-600', off: 'bg-ink-200' },
  copper: { on: 'bg-copper-500', off: 'bg-ink-200' },
  chalk: { on: 'bg-chalk', off: 'bg-chalk/20' },
  sun: { on: 'bg-sun-400', off: 'bg-chalk/20' },
}

export default function Segments({ total, done = 0, tone = 'board', className = '', label }) {
  const t = TONES[tone] || TONES.board
  const n = Math.max(0, Math.min(total, done))
  return (
    <div
      className={`flex gap-1 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={n}
      aria-label={label || `${n} of ${total} complete`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1.5 min-w-[6px] flex-1 rounded-full transition-colors duration-500 ${i < n ? t.on : t.off}`} />
      ))}
    </div>
  )
}
