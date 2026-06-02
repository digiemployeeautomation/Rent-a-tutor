'use client'
// components/practice/AudioPlayer.js
//
// Clean Tailwind wrapper around a native HTML5 <audio> element. The Listening
// page signs a short-lived URL server-side and passes it as `src`. Kept
// deliberately simple — native controls handle play/seek/volume.
//
// Props: { src }

export default function AudioPlayer({ src }) {
  if (!src) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center text-sm text-gray-400">
        Audio is not available for this set yet.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        Listening audio
      </div>
      <audio controls preload="metadata" src={src} className="w-full">
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}
