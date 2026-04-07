// app/api/payment/request/route.js
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyCsrf } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

const MU_TIMEOUT_MS = 30_000

export async function POST(request) {
  const csrf = verifyCsrf(request)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: 403 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Rate limit: 10 payment requests per minute per user
    const { limited } = await rateLimit(`pay-req:${user.id}`, 10)
    if (limited) return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })

    const { phone, lessonId } = await request.json()

    if (!phone || !lessonId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const cleaned = phone.replace(/\s+/g, '')
    if (!/^(09|07)\d{8}$/.test(cleaned)) {
      return NextResponse.json({ error: 'Enter a valid Zambian mobile number.' }, { status: 400 })
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, price, status')
      .eq('id', lessonId)
      .eq('status', 'active')
      .neq('flagged', true)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 })
    }

    const amount = lesson.price

    const { data: existing } = await supabase
      .from('lesson_purchases')
      .select('id')
      .eq('student_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'You already own this lesson.' }, { status: 409 })
    }

    if (!process.env.MONEYUNIFY_AUTH_ID) {
      console.error('[payment/request] MONEYUNIFY_AUTH_ID is not configured')
      return NextResponse.json({ error: 'Payment service unavailable.' }, { status: 503 })
    }

    const body = new URLSearchParams({
      from_payer: cleaned,
      amount:     String(amount),
      auth_id:    process.env.MONEYUNIFY_AUTH_ID,
    })

    // Call MoneyUnify with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), MU_TIMEOUT_MS)

    let muRes
    try {
      muRes = await fetch('https://api.moneyunify.one/payments/request', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept':        'application/json',
        },
        body:   body.toString(),
        signal: controller.signal,
      })
    } catch (fetchErr) {
      clearTimeout(timeoutId)
      console.error('[payment/request] MoneyUnify fetch failed:', fetchErr.message)
      return NextResponse.json(
        { error: 'Payment service is temporarily unavailable. Please try again.' },
        { status: 502 }
      )
    }
    clearTimeout(timeoutId)

    if (!muRes.ok) {
      console.error('[payment/request] MoneyUnify HTTP error:', muRes.status)
      return NextResponse.json(
        { error: 'Payment service returned an error. Please try again.' },
        { status: 502 }
      )
    }

    let muData
    try {
      muData = await muRes.json()
    } catch {
      console.error('[payment/request] MoneyUnify returned non-JSON response')
      return NextResponse.json(
        { error: 'Payment service returned an invalid response.' },
        { status: 502 }
      )
    }

    if (muData.isError || !muData.data?.transaction_id) {
      return NextResponse.json(
        { error: 'Payment request failed. Please try again.' },
        { status: 502 }
      )
    }

    // Store the pending transaction so verify can validate ownership + amount
    const { error: txErr } = await supabase.from('pending_transactions').insert({
      transaction_id: muData.data.transaction_id,
      student_id:     user.id,
      lesson_id:      lessonId,
      amount,
      created_at:     new Date().toISOString(),
    })

    if (txErr) {
      console.error('[payment/request] failed to store pending transaction:', txErr)
      return NextResponse.json(
        { error: 'Failed to initiate payment. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      transactionId: muData.data.transaction_id,
      status:        muData.data.status,
      amount,
    })

  } catch (err) {
    console.error('[payment/request]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
