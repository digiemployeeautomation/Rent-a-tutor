// app/api/contact/route.js
//
// Sends contact form submissions via Resend.
//
// Add to .env.local:
//   RESEND_API_KEY=re_your_key
//   ALERT_EMAIL_TO=admin@rentatutor.co.zm
//   ALERT_EMAIL_FROM=noreply@rentatutor.co.zm

import { NextResponse } from 'next/server'

const SUBJECTS = [
  'General enquiry', 'Payment issue', 'Tutor application',
  'Technical problem', 'Content report', 'Partnership', 'Other',
]

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 })
    }

    if (!SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: 'Invalid subject.' }, { status: 400 })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      // Resend not configured — log and return success anyway in dev
      console.warn('[contact] RESEND_API_KEY not set — email not sent')
      return NextResponse.json({ ok: true })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    process.env.ALERT_EMAIL_FROM ?? 'noreply@rentatutor.co.zm',
        to:      [process.env.ALERT_EMAIL_TO  ?? 'admin@rentatutor.co.zm'],
        reply_to: email,
        subject: `Contact form: ${subject} — ${name}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
            <h2 style="color:#173404;font-family:Georgia,serif;margin-bottom:4px;">Contact form submission</h2>
            <p style="color:#6b7280;margin-top:0;">Via rentatutor.co.zm</p>

            <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f6faf2;border-radius:12px;overflow:hidden;">
              <tr><td style="padding:10px 16px;color:#9ca3af;font-size:13px;width:100px;">Name</td><td style="padding:10px 16px;font-weight:600;">${name}</td></tr>
              <tr style="background:#eaf3de;"><td style="padding:10px 16px;color:#9ca3af;font-size:13px;">Email</td><td style="padding:10px 16px;"><a href="mailto:${email}" style="color:#27500a;">${email}</a></td></tr>
              <tr><td style="padding:10px 16px;color:#9ca3af;font-size:13px;">Subject</td><td style="padding:10px 16px;">${subject}</td></tr>
              <tr style="background:#eaf3de;"><td style="padding:10px 16px;color:#9ca3af;font-size:13px;vertical-align:top;">Message</td><td style="padding:10px 16px;white-space:pre-wrap;">${message}</td></tr>
            </table>

            <p style="color:#9ca3af;font-size:12px;">Reply directly to this email to respond to ${name}.</p>
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
