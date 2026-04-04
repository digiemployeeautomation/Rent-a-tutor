// app/api/payment/request/route.js
//
// Proxies the MoneyUnify "Request to Pay" call server-side so the
// auth_id (MONEYUNIFY_AUTH_ID) is never exposed to the browser.
//
// Add to .env.local:
//   MONEYUNIFY_AUTH_ID=your_auth_key_from_moneyunify_dashboard

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    // 1. Require a logged-in session
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // 2. Parse request body — note: amount is intentionally NOT accepted from client
    const { phone, lessonId } = await request.json()

    if (!phone || !lessonId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // 3. Validate Zambian mobile number — 10 digits starting 09 or 07
    const cleaned = phone.replace(/\s+/g, '')
    if (!/^(09|07)\d{8}$/.test(cleaned)) {
      return NextResponse.json({ error: 'Enter a valid Zambian mobile number.' }, { status: 400 })
    }

    // 4. Fetch the authoritative price from the database — never trust the client
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, price, status')
      .eq('id', lessonId)
      .eq('status', 'active')
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 })
    }

    const amount = lesson.price

    // 5. Guard against duplicate purchases (race condition safety)
    const { data: existing } = await supabase
      .from('lesson_purchases')
      .select('id')
      .eq('student_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'You already own this lesson.' }, { status: 409 })
    }

    // 6. Hit MoneyUnify
    const body = new URLSearchParams({
      from_payer: cleaned,
      amount:     String(amount),
      auth_id:    process.env.MONEYUNIFY_AUTH_ID,
    })

    const muRes = await fetch('https://api.moneyunify.one/payments/request', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept':        'application/json',
      },
      body: body.toString(),
    })

    const muData = await muRes.json()

    if (muData.isError || !muData.data?.transaction_id) {
      return NextResponse.json(
        { error: muData.message ?? 'Payment request failed. Please try again.' },
        { status: 502 }
      )
    }

    // 7. Return transaction_id and the server-authoritative amount to client for polling
    return NextResponse.json({
      transactionId: muData.data.transaction_id,
      status:        muData.data.status,    // usually "initiated"
      amount,                               // echo back so client can display correct amount
    })

  } catch (err) {
    console.error('[payment/request]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
