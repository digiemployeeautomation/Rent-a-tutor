'use client'
import { useEffect, useState } from 'react'

export default function FloatingXP({ amount, onDone }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => { setShow(false); onDone?.() }, 1000)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!show) return null

  return (
    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-pink-500 font-bold text-sm animate-float-up pointer-events-none">
      +{amount} XP
    </span>
  )
}
