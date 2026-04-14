'use client'
import { useEffect, useState } from 'react'

export default function CountUp({ target, duration = 800, className = '' }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target === 0) return
    const steps = 30
    const increment = target / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setValue(target); clearInterval(timer) }
      else setValue(Math.floor(current))
    }, interval)
    return () => clearInterval(timer)
  }, [target, duration])

  return <span className={className}>{value.toLocaleString()}</span>
}
