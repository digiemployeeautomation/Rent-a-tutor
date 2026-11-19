'use client'
// components/practice/AudioPlayer.js
//
// Card around a native HTML5 <audio> element. The Listening page signs a
// short-lived URL server-side and passes it as `src`. When there is no URL, or
// the file fails to load, it shows a friendly notice instead of a broken
// player — the questions below stay usable either way.
//
// Props: { src, title }
import { useState } from 'react'
import { Headphones, VolumeX } from 'lucide-react'

export default function AudioPlayer({ src, title = 'Listening recording' }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="card card-pad" role="status">
        <div className="flex items-start gap-4">
          <span className="icon-tile bg-sun-100 text-sun-600"><VolumeX className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <p className="font-semibold text-ink-900">The recording is not available right now</p>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-600">
              {failed
                ? 'The audio could not be loaded. Check your connection and refresh the page.'
                : 'The audio for this set is still being prepared.'}{' '}
              You can still read the questions and try them now.
            </p>
            {failed ? (
              <button type="button" className="btn-secondary btn-sm mt-3" onClick={() => setFailed(false)}>
                Try loading again
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-pad">
      <div className="flex items-center gap-3">
        <span className="icon-tile bg-teal-50 text-teal-700"><Headphones className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <p className="font-semibold text-ink-900">{title}</p>
          <p className="text-sm text-ink-500">Press play, then answer the questions as you listen.</p>
        </div>
      </div>
      <audio
        controls
        preload="metadata"
        src={src}
        onError={() => setFailed(true)}
        className="mt-4 w-full"
      >
        Your browser cannot play this recording.
      </audio>
      <p className="mt-3 text-xs text-ink-400">
        In the real test you hear each recording once. Here you can pause and replay while you practise.
      </p>
    </div>
  )
}
