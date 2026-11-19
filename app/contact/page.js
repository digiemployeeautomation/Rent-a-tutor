'use client'
import { useState } from 'react'
import { CheckCircle2, Handshake, Loader2, Mail, School, Send } from 'lucide-react'
import SiteFooter from '@/components/marketing/SiteFooter'

// Must stay a subset of the subjects accepted by /api/contact.
const SUBJECTS = ['General enquiry', 'Partnership', 'Technical problem', 'Content report', 'Other']

const TOPICS = [
  { icon: School, title: 'Schools and parents', body: 'Ask how lessons could support your students or your child.' },
  { icon: Handshake, title: 'Partnerships', body: 'Talk to us about working together or bringing your content.' },
  { icon: Mail, title: 'Help with the app', body: 'Tell us what went wrong and on which page.' },
]

const EMPTY = { name: '', email: '', subject: 'General enquiry', message: '' }

export default function ContactPage() {
  const [form, setForm]       = useState(EMPTY)
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

      const data = await res.json().catch(() => ({}))

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
    <div className="bg-paper">
      <section className="bg-ink-900 text-white">
        <div className="container-app py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sun-400">Contact</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Talk to us</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-200">
            Questions, feedback or partnership ideas — send a message and we will reply by email.
          </p>
        </div>
      </section>

      <div className="container-app grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
        <aside className="space-y-3">
          {TOPICS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-4">
              <span className="icon-tile bg-blue-50 text-blue-600"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <h2 className="font-display text-base font-semibold text-ink-900">{title}</h2>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{body}</p>
              </div>
            </div>
          ))}
        </aside>

        <div>
          {sent ? (
            <div className="card p-8 text-center sm:p-10" role="status">
              <span className="icon-tile mx-auto h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="h-page mt-5">Message sent</h2>
              <p className="mt-2 text-[15px] text-ink-500">
                Thank you. We will reply to <span className="font-semibold text-ink-900 break-all">{form.email}</span>.
              </p>
              <button
                type="button"
                onClick={() => { setSent(false); setForm(EMPTY) }}
                className="btn-secondary mt-6"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card space-y-5 p-5 sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="label">Your name</label>
                  <input id="name" type="text" name="name" autoComplete="name" required value={form.name} onChange={handleChange}
                    placeholder="Full name" className="field" />
                </div>
                <div>
                  <label htmlFor="email" className="label">Email address</label>
                  <input id="email" type="email" name="email" autoComplete="email" required value={form.email} onChange={handleChange}
                    placeholder="you@example.com" className="field" />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="label">What is it about?</label>
                <select id="subject" name="subject" value={form.subject} onChange={handleChange} className="field">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="label">Message</label>
                <textarea id="message" name="message" required rows={6} value={form.message} onChange={handleChange}
                  placeholder="How can we help?"
                  className="field resize-y" />
              </div>

              {error ? (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              ) : null}

              <button type="submit" disabled={loading} className="btn-primary btn-lg w-full sm:w-auto">
                {loading
                  ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Sending…</>
                  : <><Send className="h-5 w-5" aria-hidden="true" /> Send message</>}
              </button>
            </form>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
