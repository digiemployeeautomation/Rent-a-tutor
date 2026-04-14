// app/api/subscription/verify/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { verifyCsrf } from '@/lib/csrf'
import { getSubscriptionDuration } from '@/lib/subscription'

export async function POST(request) {
  const csrf = verifyCsrf(request)
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: 403 })
  }

  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { transactionId, planType, subjectId, formId, termId, billingType, amount } =
      await request.json()

    if (!transactionId || !planType || !formId || !billingType || amount == null) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // Call MoneyUnify verify API
    const body = new URLSearchParams({
      transaction_id: transactionId,
      auth_id:        process.env.MONEYUNIFY_AUTH_ID,
    })

    const muRes = await fetch('https://api.moneyunify.one/payments/verify', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept':        'application/json',
      },
      body: body.toString(),
    })

    const muData = await muRes.json()
    const status = muData.data?.status

    if (status === 'initiated' || status === 'otp-pending') {
      return NextResponse.json({ status })
    }

    if (muData.isError || status !== 'successful') {
      return NextResponse.json(
        { status: 'failed', error: muData.message ?? 'Payment failed.' },
        { status: 402 }
      )
    }

    // Calculate expires_at based on plan type
    const { months } = getSubscriptionDuration(planType)
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + months)

    // Insert subscription record
    const { data: subscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        student_id:   user.id,
        plan_type:    planType,
        subject_id:   subjectId || null,
        form_id:      formId,
        term_id:      termId || null,
        billing_type: billingType,
        status:       'active',
        starts_at:    new Date().toISOString(),
        expires_at:   expiresAt.toISOString(),
        price_paid:   amount,
      })
      .select('id, plan_type, expires_at')
      .single()

    if (insertError) {
      console.error('[subscription/verify] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create subscription.' }, { status: 500 })
    }

    // Delete the pending transaction
    await supabase.from('pending_transactions').delete().eq('transaction_id', transactionId)

    return NextResponse.json({
      success: true,
      subscription: {
        id:        subscription.id,
        plan_type: subscription.plan_type,
        expires_at: subscription.expires_at,
      },
    })

  } catch (err) {
    console.error('[subscription/verify]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
