// app/api/subscription/request/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { verifyCsrf } from '@/lib/csrf'
import { hasAccess } from '@/lib/subscription'

// Placeholder prices (ZMW) — update when real pricing is confirmed
const PRICES = {
  subject: { monthly: 50 },
  term:    { monthly: 150, one_time: 500 },
  form:    { monthly: 300, one_time: 3000 },
}

const VALID_PLAN_TYPES = ['subject', 'term', 'form']

export async function POST(request) {
  // 1. Verify CSRF
  const csrf = verifyCsrf(request)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: 403 })
  }

  try {
    // 2. Get authenticated user
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const { phone, planType, subjectId, formId, termId, billingType } = body

    // 3. Validate phone (Zambian format)
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 })
    }
    const cleaned = phone.replace(/\s+/g, '')
    if (!/^(09|07)\d{8}$/.test(cleaned)) {
      return NextResponse.json({ error: 'Enter a valid Zambian mobile number.' }, { status: 400 })
    }

    // 4. Validate planType
    if (!planType || !VALID_PLAN_TYPES.includes(planType)) {
      return NextResponse.json(
        { error: 'planType must be one of: subject, term, form.' },
        { status: 400 }
      )
    }

    // 5. Validate required IDs based on planType
    if (!formId) {
      return NextResponse.json({ error: 'formId is required.' }, { status: 400 })
    }
    if ((planType === 'subject' || planType === 'term') && !termId) {
      return NextResponse.json(
        { error: `termId is required for planType "${planType}".` },
        { status: 400 }
      )
    }
    if (planType === 'subject' && !subjectId) {
      return NextResponse.json(
        { error: 'subjectId is required for planType "subject".' },
        { status: 400 }
      )
    }

    // Validate billingType
    const resolvedBillingType = billingType || 'monthly'
    if (!['monthly', 'one_time'].includes(resolvedBillingType)) {
      return NextResponse.json(
        { error: 'billingType must be "monthly" or "one_time".' },
        { status: 400 }
      )
    }

    // subject plan only supports monthly billing
    if (planType === 'subject' && resolvedBillingType === 'one_time') {
      return NextResponse.json(
        { error: 'The subject plan does not support one-time billing.' },
        { status: 400 }
      )
    }

    // 6. Calculate price
    const planPrices = PRICES[planType]
    const amount = planPrices[resolvedBillingType] ?? planPrices.monthly

    // 7. Check for existing active subscription covering the same scope
    const alreadySubscribed = await hasAccess(supabase, user.id, {
      subjectId,
      formId,
      termId,
    })
    if (alreadySubscribed) {
      return NextResponse.json(
        { error: 'You already have an active subscription covering this content.' },
        { status: 409 }
      )
    }

    // 8. Call MoneyUnify API
    if (!process.env.MONEYUNIFY_AUTH_ID) {
      console.error('[subscription/request] MONEYUNIFY_AUTH_ID is not configured')
      return NextResponse.json({ error: 'Payment service unavailable.' }, { status: 503 })
    }

    const muBody = new URLSearchParams({
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
      body: muBody.toString(),
    })

    const muData = await muRes.json()

    if (muData.isError || !muData.data?.transaction_id) {
      return NextResponse.json(
        { error: muData.message ?? 'Payment request failed. Please try again.' },
        { status: 502 }
      )
    }

    const transactionId = muData.data.transaction_id

    // 9. Store pending transaction
    // lesson_id is NULL for subscriptions; subscription metadata is returned to
    // the client so the verify endpoint can receive it.
    const { error: txErr } = await supabase.from('pending_transactions').insert({
      transaction_id: transactionId,
      student_id:     user.id,
      lesson_id:      null,
      amount,
      created_at:     new Date().toISOString(),
    })

    if (txErr) {
      console.error('[subscription/request] failed to store pending transaction:', txErr)
      return NextResponse.json(
        { error: 'Failed to initiate payment. Please try again.' },
        { status: 500 }
      )
    }

    // 10. Return transaction details + subscription metadata for the verify step
    return NextResponse.json({
      transactionId,
      status:      muData.data.status,
      amount,
      planType,
      subjectId:   subjectId ?? null,
      formId,
      termId:      termId ?? null,
      billingType: resolvedBillingType,
    })

  } catch (err) {
    console.error('[subscription/request]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
