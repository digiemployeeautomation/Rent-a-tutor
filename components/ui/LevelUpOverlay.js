'use client'
import { useEffect, useState } from 'react'

export default function LevelUpOverlay({ level, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); onDone?.() }, 2000)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
      <div className="animate-level-up bg-white rounded-3xl p-10 text-center shadow-2xl">
        <div className="text-5xl mb-3">🎉</div>
        <div className="text-2xl font-bold text-blue-600">Level {level}!</div>
        <div className="text-gray-500 mt-1 text-sm">Keep going!</div>
      </div>
    </div>
  )
}
