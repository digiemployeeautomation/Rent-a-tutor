'use client'

export default function VideoPlayer({ cloudflareVideoId, contentUrl }) {
  // Determine which video source to use
  const isCloudflare = cloudflareVideoId && /^[0-9a-f]{32}$/i.test(cloudflareVideoId)
  const isYouTube = cloudflareVideoId && /^[A-Za-z0-9_-]{11}$/.test(cloudflareVideoId)

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 */ }}>
        {isCloudflare ? (
          <iframe
            src={`https://iframe.videodelivery.net/${cloudflareVideoId}`}
            className="absolute inset-0 w-full h-full rounded-xl"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title="Lesson video"
          />
        ) : isYouTube ? (
          <iframe
            src={`https://www.youtube.com/embed/${cloudflareVideoId}`}
            className="absolute inset-0 w-full h-full rounded-xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Lesson video"
          />
        ) : contentUrl ? (
          <video
            src={contentUrl}
            controls
            className="absolute inset-0 w-full h-full rounded-xl bg-black"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-gray-50 text-gray-400 gap-3">
            <svg className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">Video coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
