'use client'
// components/practice/AudioPlayer.js
//
// The Listening player: a round play / pause button, a thin progress line you
// can drag, elapsed and total time, and "back 10 seconds". A native <audio>
// element does the playing, so it behaves on phones and with a screen reader;
// only the controls are drawn here. The Listening page signs a short-lived URL
// server-side and passes it as `src`. When there is no URL, or the file fails
// to load, it shows a plain notice instead of a broken player — the questions
// stay usable either way.
//
// On phones the player sticks under the top bar while the questions scroll.
//
// Props: { src, title }
import { useEffect, useRef, useState } from 'react'
import { Loader2, Pause, Play, RotateCcw } from 'lucide-react'

function clock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--'
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function AudioPlayer({ src, title = 'Listening recording' }) {
  const audioRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(null)

  // The file may already be loaded (or already broken) before React attaches
  // its listeners, so read the element once on mount.
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (a.error) setFailed(true)
    if (Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration)
  }, [failed])

  if (!src || failed) {
    return (
      <section aria-label="Recording" role="status" className="rounded-xl border border-sun-300 bg-sun-50 p-5">
        <p className="h-sub">The recording is not available right now</p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-700">
          {failed
            ? 'The audio could not be loaded. Check your connection and try again.'
            : 'The audio for this set is still being prepared.'}{' '}
          You can still read the questions and try them now.
        </p>
        {failed ? (
          <button
            type="button"
            className="btn-secondary btn-sm mt-3"
            onClick={() => { setFailed(false); setPlaying(false); setWaiting(false); setCurrent(0); setDuration(null) }}
          >
            Try loading again
          </button>
        ) : null}
      </section>
    )
  }

  const known = Number.isFinite(duration) && duration > 0
  const pct = known ? Math.min(100, (current / duration) * 100) : 0

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      const p = a.play()
      // A rejected play() (autoplay rules, interrupted load) is not a broken
      // file: the `error` event covers that. Just fall back to "paused".
      if (p && typeof p.catch === 'function') p.catch(() => setPlaying(false))
    } else {
      a.pause()
    }
  }

  function seek(to) {
    const a = audioRef.current
    if (!a || !Number.isFinite(to)) return
    const max = known ? duration : to
    const t = Math.max(0, Math.min(max, to))
    try { a.currentTime = t } catch { return }
    setCurrent(t)
  }

  return (
    <section
      aria-label="Recording"
      className="sticky top-[61px] z-20 -mx-5 border-b border-ink-200 bg-paper px-5 py-3 sm:-mx-8 sm:px-8 lg:top-24 lg:mx-0 lg:rounded-xl lg:border lg:bg-white lg:p-6"
    >
      <audio
        ref={audioRef}
        preload="metadata"
        src={src}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPlaying={() => { setPlaying(true); setWaiting(false) }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setWaiting(true)}
        onCanPlay={() => setWaiting(false)}
        onEnded={() => { setPlaying(false); setWaiting(false) }}
        onError={() => setFailed(true)}
        className="hidden"
      >
        Your browser cannot play this recording.
      </audio>

      <p className="hidden text-[13px] font-bold leading-5 text-copper-700 lg:block">Recording</p>
      <p className="hidden font-display text-[1.25rem] font-semibold leading-snug text-ink-900 lg:mb-5 lg:mt-0.5 lg:block">
        {title.replace(/^Recording:\s*/, '')}
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause the recording' : 'Play the recording'}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-board-700 text-chalk transition-colors duration-150 hover:bg-board-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-board-600 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-px"
        >
          {waiting && playing ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          ) : playing ? (
            <Pause className="h-6 w-6" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          ) : (
            <Play className="ml-0.5 h-6 w-6" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-5 text-ink-900 lg:hidden">{title}</p>
          {/* Progress line. The real control is the range input laid over it. */}
          <div className="relative mt-1 flex h-6 items-center lg:mt-0">
            <input
              type="range"
              min={0}
              max={known ? Math.floor(duration) : 0}
              step={1}
              value={Math.floor(current)}
              disabled={!known}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Position in the recording"
              aria-valuetext={`${clock(current)} of ${clock(duration)}`}
              className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
            />
            <div className="relative h-[3px] w-full rounded-full bg-ink-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-board-600">
              <div className="absolute inset-y-0 left-0 rounded-full bg-board-700" style={{ width: `${pct}%` }} />
              <span
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-board-700"
                style={{ left: `${pct}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 text-[13px] font-semibold leading-5 text-ink-500 tabular">
            <span><span className="text-ink-900">{clock(current)}</span> / {clock(duration)}</span>
            <button
              type="button"
              onClick={() => seek((audioRef.current?.currentTime ?? current) - 10)}
              className="-my-2.5 -mr-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-2 font-bold text-ink-700 hover:text-ink-900"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Back 10 sec
            </button>
          </div>
        </div>
      </div>

      <p className="mt-5 hidden border-t border-ink-200 pt-4 text-sm leading-relaxed text-ink-600 lg:block">
        In the real test you hear each recording once. Here you can pause and replay while you practise.
      </p>
    </section>
  )
}
