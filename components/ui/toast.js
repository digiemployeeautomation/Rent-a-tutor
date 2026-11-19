'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const toast = useCallback((message) => addToast(message, 'success'), [addToast])
  toast.success = (msg) => addToast(msg, 'success')
  toast.error = (msg) => addToast(msg, 'error')
  toast.info = (msg) => addToast(msg, 'info')

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6" style={{ maxWidth: 360 }}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function Toast({ message, type, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const colors = {
    success: { bg: 'var(--toast-success-bg, #ecfdf5)', border: 'var(--toast-success-border, #a7f3d0)', text: 'var(--toast-success-text, #065f46)', icon: '✓' },
    error:   { bg: 'var(--toast-error-bg, #fef2f2)',   border: 'var(--toast-error-border, #fecaca)',   text: 'var(--toast-error-text, #991b1b)',   icon: '✕' },
    info:    { bg: 'var(--toast-info-bg, #eff6ff)',    border: 'var(--toast-info-border, #bfdbfe)',    text: 'var(--toast-info-text, #1e40af)',    icon: 'i' },
  }
  const c = colors[type] ?? colors.info

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg transition-all duration-300 ease-out"
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        opacity: visible ? 1 : 0,
      }}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: c.text, color: c.bg }} aria-hidden="true">
        {c.icon}
      </span>
      <span className="flex-1 text-sm font-semibold">{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="ml-2 flex-shrink-0 text-sm opacity-60 hover:opacity-100">✕</button>
    </div>
  )
}
