'use client'
// components/practice/ClipPlayer.js
//
// A small playback row for one spoken answer: round play / pause button, a
// thin progress line (tap to jump) and the time. Used by the Recorder for the
// clip that was just recorded and by the Speaking result for the saved one.
//
// Props: { src, duration (seconds, if already known), label, disabled, failedText }
import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

function fmt(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function ClipPlayer({
  src, duration = 0, label = 'Your recording', disabled = false, className = '',
  failedText = 'Your browser cannot play this recording back.',
}) {
  const audioRef = useRef(null)
  // Browser recordings (webm) often report an unknown length until the end has
  // been read once; `probing` is that one-off seek to find it.
  const probingRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(duration)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    probingRef.current = false
    setPlaying(false)
    setCurrent(0)
    setTotal(duration)
    setFailed(false)
  }, [src, duration])

  // Stop the sound if the row is disabled mid-play (for example while sending).
  useEffect(() => {
    if (disabled) audioRef.current?.pause()
  }, [disabled])

  function onMeta(e) {
    const a = e.currentTarget
    if (Number.isFinite(a.duration) && a.duration > 0) {
      if (!duration) setTotal(a.duration)
    } else if (!duration && !probingRef.current) {
      probingRef.current = true
      try { a.currentTime = 1e101 } catch { probingRef.current = false }
    }
  }

  function onDurationChange(e) {
    const a = e.currentTarget
    if (!Number.isFinite(a.duration) || a.duration <= 0) return
    if (!duration) setTotal(a.duration)
    if (probingRef.current) {
      probingRef.current = false
      try { a.currentTime = 0 } catch {}
    }
  }

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play().catch(() => setFailed(true))
    else a.pause()
  }

  function seek(e) {
    const a = audioRef.current
    if (!a || disabled || !(total > 0)) return
    const box = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width))
    try { a.currentTime = ratio * total } catch {}
    setCurrent(ratio * total)
  }

  const known = total > 0 && Number.isFinite(total)
  const pct = known ? Math.min(100, (current / total) * 100) : 0

  return (
    <div className={className}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={onMeta}
        onDurationChange={onDurationChange}
        onTimeUpdate={(e) => { if (!probingRef.current) setCurrent(e.currentTarget.currentTime) }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
        onError={() => setFailed(true)}
      />
      <div className="flex items-center gap-4 sm:gap-5">
        <button
          type="button"
          onClick={toggle}
          disabled={disabled || failed}
          aria-label={playing ? `Pause ${label.toLowerCase()}` : `Play ${label.toLowerCase()}`}
          className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-2 border-ink-900 bg-white text-ink-900 transition-colors duration-150 hover:bg-ink-900 hover:text-chalk focus:outline-none focus-visible:ring-2 focus-visible:ring-board-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-ink-300 disabled:text-ink-400 disabled:hover:bg-white disabled:hover:text-ink-400"
        >
          {playing
            ? <Pause className="h-7 w-7 fill-current" aria-hidden="true" />
            : <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[17px] font-bold leading-snug text-ink-900">{label}</p>
            <p className="shrink-0 text-[15px] font-semibold text-ink-500 tabular">
              <span className="numeral text-[1.375rem] leading-none text-ink-900">{fmt(current)}</span>
              {known ? <> / {fmt(total)}</> : null}
            </p>
          </div>
          {/* Tall hit area around a thin line */}
          <div className={`-my-1 py-3 ${known && !disabled ? 'cursor-pointer' : ''}`} onClick={seek} aria-hidden="true">
            <div className="progress-track">
              <div className="h-full rounded-full bg-ink-900" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
      {failed ? (
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{failedText}</p>
      ) : null}
    </div>
  )
}
