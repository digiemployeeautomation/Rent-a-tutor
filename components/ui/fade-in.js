'use client'

import { useEffect, useRef, useState } from 'react'

export function FadeIn({ children, className = '', delay = 0, duration = 420 }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced-motion preference — show immediately
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) {
      setVisible(true)
      return
    }

    let timer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [delay])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(14px)',
        transition: visible
          ? `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms,
             transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`
          : 'none',
      }}
    >
      {children}
    </div>
  )
}
