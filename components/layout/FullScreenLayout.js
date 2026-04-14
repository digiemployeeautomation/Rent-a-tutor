'use client'
import { useRouter } from 'next/navigation'

export default function FullScreenLayout({ title, progress, children }) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center px-4 py-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-1 text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="flex-1 text-center text-sm font-medium text-gray-700 truncate px-4">{title}</span>
        <div className="w-6" />
      </div>
      {progress !== undefined && (
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-blue-500 transition-all duration-600 ease-out" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
