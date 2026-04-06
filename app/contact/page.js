'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default function ContactPage() {
  const [form, setForm]       = useState({ name: '', email: '', subject: 'General enquiry', message: '' })
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      <div className="px-6 py-12 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <h1 className="font-serif text-4xl mb-3" style={{ color: 'var(--color-surface-mid)' }}>
          Contact us
        </h1>
        <p className="text-sm opacity-80" style={{ color: 'var(--color-surface-mid)' }}>
          Questions, feedback, or partnership enquiries — we read everything.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-lg mb-3" style={{ color: 'var(--color-primary)' }}>Get in touch</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We usually reply within one business day. For urgent issues with payments or account access, please include your registered email address.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Email',     value: 'hello@rentatutor.co.zm'  },
              { label: 'WhatsApp',  value: '+260 97X XXX XXX'        },
              { label: 'Hours',     value: 'Mon–Fri, 8am–6pm CAT'    },
            ].map(c => (
              <div key={c.label}>
                <div className="text-xs font-medium text-gray-500 mb-0.5">{c.label}</div>
                <div className="text-sm text-gray-700">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-primary)' }}>Common topics</div>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li>• Payment not received or incorrect</li>
              <li>• Video not loading after purchase</li>
              <li>• Tutor application status</li>
              <li>• Reporting inappropriate content</li>
              <li>• Withdrawal and payout issues</li>
            </ul>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          {sent ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="font-serif text-xl mb-2" style={{ color: 'var(--color-primary)' }}>
                Message sent!
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                We'll reply to <strong>{form.email}</strong> within one business day.
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: '', email: '', subject: 'General enquiry', message: '' }) }}
                className="text-sm px-5 py-2.5 rounded-lg"
                style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Your name</label>
                  <input type="text" name="name" required value={form.name} onChange={handleChange}
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Email address</label>
                  <input type="email" name="email" required value={form.email} onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Subject</label>
                <select name="subject" value={form.subject} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white">
                  {['General enquiry','Payment issue','Tutor application','Technical problem','Content report','Partnership','Other']
                    .map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Message</label>
                <textarea name="message" required rows={5} value={form.message} onChange={handleChange}
                  placeholder="Describe your issue or question in as much detail as possible..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400 resize-none" />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
                {loading ? 'Sending...' : 'Send message →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
