// app/api/demo/start/route.js
//
// POST — creates a fresh throw-away demo student, seeds sample progress and
// returns its credentials. The /demo page then signs in with them.
//   200 { email, password }   |   4xx/5xx { error }
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabaseServer'
import { rateLimit } from '@/lib/rate-limit'
import { DEMO_RATE_LIMIT, DEMO_RATE_WINDOW_MS } from '@/lib/demo/config'
import { createDemoUser, isOverHardCap, pruneDemoUsers } from '@/lib/demo/accounts'
import { seedDemoAccount } from '@/lib/demo/seed'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  try {
    const { limited } = await rateLimit(`demo-start:${ip}`, DEMO_RATE_LIMIT, DEMO_RATE_WINDOW_MS)
    if (limited) {
      return NextResponse.json({ error: 'Too many demo accounts from this connection. Please wait a few minutes and try again.' }, { status: 429 })
    }
  } catch (err) {
    // A rate-limiter outage should not take the demo down.
    console.warn('[demo/start] rate limit check failed:', err.message)
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (err) {
    console.error('[demo/start] service client:', err.message)
    return NextResponse.json({ error: 'The demo is not available right now.' }, { status: 503 })
  }

  try {
    const count = await pruneDemoUsers(admin)
    if (isOverHardCap(count)) {
      return NextResponse.json({ error: 'The demo is very busy right now. Please try again later.' }, { status: 503 })
    }
  } catch (err) {
    console.error('[demo/start] prune failed:', err.message)
    return NextResponse.json({ error: 'The demo is not available right now.' }, { status: 503 })
  }

  let created
  try {
    created = await createDemoUser(admin)
  } catch (err) {
    console.error('[demo/start]', err.message)
    return NextResponse.json({ error: 'Could not create a demo account. Please try again.' }, { status: 500 })
  }

  try {
    await seedDemoAccount(admin, created.user.id)
  } catch (err) {
    // The account still works; it just starts empty.
    console.error('[demo/start] seeding failed:', err.message)
  }

  return NextResponse.json(
    { email: created.email, password: created.password },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
