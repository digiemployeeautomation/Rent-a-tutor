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
      return NextResponse.json({ status: 'failed', error: muData.message ?? 'Payment failed.' })
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
    }

    // increment_purchase_count is now secured in Postgres — see secure-rpc.sql
    await supabase.rpc('increment_purchase_count', { lesson_id_input: lessonId })

    return NextResponse.json({ status: 'successful' })

  } catch (err) {
    console.error('[payment/verify]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
