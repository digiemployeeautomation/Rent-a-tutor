// app/api/payment/verify/route.js
//
// Proxies MoneyUnify "Verify Payment" and, on success, writes the
// lesson_purchases row. Keeping the insert here (server-side) means
// a purchase record is only created after the payment gateway
// confirms it — not before.

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    // 1. Auth
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // 2. Parse
    const { transactionId, lessonId, amount } = await request.json()

    if (!transactionId || !lessonId || !amount) {
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })
    }

    // 3. Verify with MoneyUnify
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
    const status = muData.data?.status // 'successful' | 'initiated' | 'otp-pending' | 'failed'

    // 4. If still pending, tell the client to keep polling
    if (status === 'initiated' || status === 'otp-pending') {
      return NextResponse.json({ status })
    }

    // 5. If failed / error
    if (muData.isError || status !== 'successful') {
      return NextResponse.json({ status: 'failed', error: muData.message ?? 'Payment failed.' })
    }

    // 6. Payment confirmed — write purchase record (idempotent via ON CONFLICT DO NOTHING)
    const { error: insertError } = await supabase
      .from('lesson_purchases')
      .upsert(
        {
          student_id:  user.id,
          lesson_id:   lessonId,
          amount_paid: amount,
          purchased_at: new Date().toISOString(),
          transaction_id: transactionId,
        },
        { onConflict: 'student_id,lesson_id', ignoreDuplicates: true }
      )

    if (insertError) {
      console.error('[payment/verify] insert error:', insertError)
      // Don't block the user — payment was confirmed, purchase record issue is recoverable
    }

    // 7. Increment purchase_count on the lesson
    await supabase.rpc('increment_purchase_count', { lesson_id_input: lessonId })
    // ^ Create this Postgres function in Supabase SQL editor:
    //   CREATE OR REPLACE FUNCTION increment_purchase_count(lesson_id_input UUID)
    //   RETURNS void AS $$
    //     UPDATE lessons SET purchase_count = purchase_count + 1
    //     WHERE id = lesson_id_input;
    //   $$ LANGUAGE sql;

    return NextResponse.json({ status: 'successful' })

  } catch (err) {
    console.error('[payment/verify]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
