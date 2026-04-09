// components/layout/StudentSettingsSidebar.js
'use client'
import { useState, useEffect, useRef } from 'react'
import { Sun, Moon, X, User, Bell, Shield, Palette } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'

export default function StudentSettingsSidebar({ open, onClose }) {
  const { darkMode, toggleDark } = useTheme()
  const panelRef = useRef(null)
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [emailNotifs, setEmailNotifs] = useState(true)

  useEffect(() => {
    if (!open) return
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setFullName(data.full_name ?? '')
      }
    }
    load()
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSaveName() {
    if (!fullName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          zIndex: 200,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 250ms ease',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          maxWidth: '90vw',
          zIndex: 201,
          backgroundColor: 'var(--color-page-bg, #fff)',
          borderLeft: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.12)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            fontFamily: 'Georgia, serif',
            color: 'var(--color-primary, #173404)',
            margin: 0,
          }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 10,
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Profile section ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <User size={15} style={{ color: 'var(--color-primary-mid)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary, #173404)' }}>
                Profile
              </span>
            </div>

            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>
              Display name
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{
                  flex: 1,
                  fontSize: 13,
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.12)',
                  backgroundColor: 'var(--color-surface, #f9faf6)',
                  color: 'var(--color-primary, #173404)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={saving || !fullName.trim()}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: saving ? 'wait' : 'pointer',
                  backgroundColor: 'var(--color-primary-mid)',
                  color: '#fff',
                  opacity: saving || !fullName.trim() ? 0.5 : 1,
                  transition: 'opacity 150ms',
                }}
              >
                {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </section>

          <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

          {/* ── Appearance section ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Palette size={15} style={{ color: 'var(--color-primary-mid)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary, #173404)' }}>
                Appearance
              </span>
            </div>

            <button
              onClick={toggleDark}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.08)',
                backgroundColor: 'var(--color-surface, #f9faf6)',
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {darkMode ? <Moon size={15} /> : <Sun size={15} />}
                <span style={{ fontSize: 13, color: 'var(--color-primary, #173404)' }}>
                  {darkMode ? 'Dark mode' : 'Light mode'}
                </span>
              </div>
              {/* Toggle track */}
              <div style={{
                width: 40,
                height: 22,
                borderRadius: 99,
                backgroundColor: darkMode ? 'var(--color-primary-mid)' : 'rgba(0,0,0,0.15)',
                position: 'relative',
                transition: 'background-color 200ms',
              }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: 3,
                  left: darkMode ? 21 : 3,
                  transition: 'left 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </button>
          </section>

          <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

          {/* ── Notifications section ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Bell size={15} style={{ color: 'var(--color-primary-mid)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary, #173404)' }}>
                Notifications
              </span>
            </div>

            <button
              onClick={() => setEmailNotifs(v => !v)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.08)',
                backgroundColor: 'var(--color-surface, #f9faf6)',
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--color-primary, #173404)' }}>
                Email notifications
              </span>
              <div style={{
                width: 40,
                height: 22,
                borderRadius: 99,
                backgroundColor: emailNotifs ? 'var(--color-primary-mid)' : 'rgba(0,0,0,0.15)',
                position: 'relative',
                transition: 'background-color 200ms',
              }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: 3,
                  left: emailNotifs ? 21 : 3,
                  transition: 'left 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </button>
          </section>

          <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

          {/* ── Account section ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Shield size={15} style={{ color: 'var(--color-primary-mid)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary, #173404)' }}>
                Account
              </span>
            </div>

            <button
              onClick={async () => {
                const confirmed = window.confirm('Are you sure you want to reset your password? You will receive an email with a reset link.')
                if (!confirmed) return
                const { data: { user } } = await supabase.auth.getUser()
                if (user?.email) {
                  await supabase.auth.resetPasswordForEmail(user.email)
                  alert('Password reset email sent!')
                }
              }}
              style={{
                width: '100%',
                fontSize: 13,
                padding: '10px 14px',
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.08)',
                backgroundColor: 'var(--color-surface, #f9faf6)',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-primary, #173404)',
                transition: 'background-color 150ms',
              }}
            >
              Reset password
            </button>
          </section>
        </div>
      </div>
    </>
  )
}
