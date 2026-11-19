// app/api/keepalive/route.js
//
// GET — runs one trivial database query so the free-plan Supabase project
// never sits idle long enough to pause. Called daily by the Vercel cron in
// vercel.json.
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = createServiceRoleClient()
    const { error } = await admin.from('practice_items').select('id').limit(1)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, at: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[keepalive]', err.message)
    return NextResponse.json({ ok: false, error: 'Database check failed' }, { status: 500 })
  }
}
