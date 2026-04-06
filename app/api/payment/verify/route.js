// app/api/payment/verify/route.js
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyCsrf } from '@/lib/csrf'

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

    const { transactionId, lessonId } = await request.json()

    if (!transactionId || !lessonId) {
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })
    }

    // Verify the transaction belongs to this user and lesson
    const { data: pendingTx } = await supabase
      .from('pending_transactions')
      .select('student_id, lesson_id, amount')
      .eq('transaction_id', transactionId)
      .single()

    if (!pendingTx) {
      return NextResponse.json({ error: 'Unknown transaction.' }, { status: 400 })
    }
    if (pendingTx.student_id !== user.id) {
      return NextResponse.json({ error: 'Transaction does not belong to you.' }, { status: 403 })
    }
    if (pendingTx.lesson_id !== lessonId) {
      return NextResponse.json({ error: 'Transaction/lesson mismatch.' }, { status: 400 })
    }

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

    // Verify the gateway amount matches the lesson price
    const gatewayAmount = Number(muData.data?.amount)
    if (!isNaN(gatewayAmount) && gatewayAmount < amount) {
      console.error(`[payment/verify] amount mismatch: gateway=${gatewayAmount}, lesson=${amount}`)
      return NextResponse.json(
        { error: 'Payment amount does not match lesson price.' },
        { status: 400 }
      )
    }

    const { error: insertError } = await supabase
      .from('lesson_purchases')
      .upsert(
        {
          student_id:     user.id,
          lesson_id:      lessonId,
          amount_paid:    amount,
          purchased_at:   new Date().toISOString(),
          transaction_id: transactionId,
        },
        { onConflict: 'student_id,lesson_id', ignoreDuplicates: true }
      )

    if (insertError) {
      console.error('[payment/verify] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to record purchase.' }, { status: 500 })
    }

    // increment_purchase_count is now secured in Postgres — see secure-rpc.sql
    const { error: rpcError } = await supabase.rpc('increment_purchase_count', { lesson_id_input: lessonId })
    if (rpcError) {
      console.error('[payment/verify] increment_purchase_count error:', rpcError)
    }

    // Clean up the pending transaction
    await supabase.from('pending_transactions').delete().eq('transaction_id', transactionId)

    return NextResponse.json({ status: 'successful' })

  } catch (err) {
    console.error('[payment/verify]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
