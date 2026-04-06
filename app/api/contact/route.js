// app/api/contact/route.js
import { NextResponse } from 'next/server'
import { verifyCsrf } from '@/lib/csrf'

const SUBJECTS = [
  'General enquiry', 'Payment issue', 'Tutor application',
  'Technical problem', 'Content report', 'Partnership', 'Other',
]

// Escape user-supplied values before embedding them in HTML email bodies.
// Without this an attacker could inject arbitrary HTML/JS into admin emails.
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(request) {
  // CSRF guard
  const csrf = verifyCsrf(request)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: 403 })
  }

  try {
    const { name, email, subject, message } = await request.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 })
    }

    if (!SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: 'Invalid subject.' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('[contact] RESEND_API_KEY not set — email not sent')
      return NextResponse.json({ ok: true })
    }

    // Escape all user-supplied values before injecting into HTML
    const safeName    = escapeHtml(name)
    const safeEmail   = escapeHtml(email)
    const safeSubject = escapeHtml(subject)
    const safeMessage = escapeHtml(message)

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:     process.env.ALERT_EMAIL_FROM ?? 'noreply@rentatutor.co.zm',
        to:       [process.env.ALERT_EMAIL_TO  ?? 'admin@rentatutor.co.zm'],
        reply_to: safeEmail,
        subject:  `Contact form: ${safeSubject} — ${safeName}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
            <h2 style="color:#173404;font-family:Georgia,serif;margin-bottom:4px;">Contact form submission</h2>
            <p style="color:#6b7280;margin-top:0;">Via rentatutor.co.zm</p>

            <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f6faf2;border-radius:12px;overflow:hidden;">
              <tr><td style="padding:10px 16px;color:#9ca3af;font-size:13px;width:100px;">Name</td><td style="padding:10px 16px;font-weight:600;">${safeName}</td></tr>
              <tr style="background:#eaf3de;"><td style="padding:10px 16px;color:#9ca3af;font-size:13px;">Email</td><td style="padding:10px 16px;"><a href="mailto:${safeEmail}" style="color:#27500a;">${safeEmail}</a></td></tr>
              <tr><td style="padding:10px 16px;color:#9ca3af;font-size:13px;">Subject</td><td style="padding:10px 16px;">${safeSubject}</td></tr>
              <tr style="background:#eaf3de;"><td style="padding:10px 16px;color:#9ca3af;font-size:13px;vertical-align:top;">Message</td><td style="padding:10px 16px;white-space:pre-wrap;">${safeMessage}</td></tr>
            </table>

            <p style="color:#9ca3af;font-size:12px;">Reply directly to this email to respond to ${safeName}.</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('[contact] Resend error:', err)
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
