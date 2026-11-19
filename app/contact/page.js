'use client'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import SiteFooter from '@/components/marketing/SiteFooter'

// Must stay a subset of the subjects accepted by /api/contact.
const SUBJECTS = ['General enquiry', 'Partnership', 'Technical problem', 'Content report', 'Other']

const TOPICS = [
  { title: 'Schools and parents', body: 'Ask how lessons could support your students or your child.' },
  { title: 'Partnerships', body: 'Talk to us about working together or bringing your content.' },
  { title: 'Help with the app', body: 'Tell us what went wrong and on which page.' },
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
    <div>
      <div className="container-app pt-10 sm:pt-16">
        <header className="max-w-2xl">
          <h1 className="h-display">Talk to us.</h1>
          <p className="lead mt-5">
            Questions, feedback or partnership ideas: send a message and we will reply by email.
          </p>
        </header>

        <div className="mt-10 grid gap-x-16 gap-y-14 sm:mt-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div>
            {sent ? (
              <div className="border-t-2 border-ink-900 pt-8" role="status">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-board-700 text-chalk">
                  <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                </span>
                <h2 className="h-page mt-5">Message sent.</h2>
                <p className="mt-2.5 max-w-[48ch] text-[17px] leading-[1.5] text-ink-600">
                  Thank you. We will reply to <span className="break-all font-bold text-ink-900">{form.email}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => { setSent(false); setForm(EMPTY) }}
                  className="btn-secondary mt-7"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 border-t-2 border-ink-900 pt-6" aria-labelledby="contact-form-title">
                <h2 id="contact-form-title" className="h-section">Send a message</h2>
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
                  <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[15px] font-semibold leading-snug text-rose-800">{error}</div>
                ) : null}

                <button type="submit" disabled={loading} className="btn-primary btn-lg w-full sm:w-auto">
                  {loading
                    ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Sending…</>
                    : 'Send message'}
                </button>
              </form>
            )}
          </div>

          <aside aria-labelledby="contact-topics-title">
            <h2 id="contact-topics-title" className="h-section border-t-2 border-ink-900 pt-6">What people write about</h2>
            <dl className="mt-3 divide-y divide-ink-200 border-b border-ink-200">
              {TOPICS.map(({ title, body }) => (
                <div key={title} className="py-4">
                  <dt className="text-[17px] font-bold leading-snug text-ink-900">{title}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-ink-600">{body}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
