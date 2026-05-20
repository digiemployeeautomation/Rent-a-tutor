// app/api/onboarding/ielts/route.js
//
// Persists the IELTS onboarding questionnaire answers and seeds the
// initial per-sub-skill user_tracks rows.
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { isValidProfile, initialUserTracks } from '@/lib/ielts/onboarding'

export async function POST(request) {
  const supabase = createServerClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let answers
  try {
    answers = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isValidProfile(answers)) {
    return NextResponse.json({ error: 'Profile is incomplete or invalid' }, { status: 400 })
  }

  const profileRow = {
    user_id:            user.id,
    variant:            answers.variant,
    target_band:        answers.target_band,
    per_section_target: answers.per_section_target ?? null,
    test_date:          answers.test_date ?? null,
    current_band_self:  answers.current_band_self ?? null,
    weakest_section:    answers.weakest_section ?? null,
    hours_per_week:     answers.hours_per_week,
    first_language:     answers.first_language ?? null,
    updated_at:         new Date().toISOString(),
  }

  const { error: profileErr } = await supabase
    .from('user_ielts_profile')
    .upsert(profileRow, { onConflict: 'user_id' })

  if (profileErr) {
    console.error('[onboarding/ielts] profile upsert error:', profileErr)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }

  const trackRows = initialUserTracks(answers).map((t) => ({
    user_id: user.id,
    sub_skill: t.sub_skill,
    track: t.track,
    inferred_from: t.inferred_from,
    updated_at: new Date().toISOString(),
  }))

  const { error: tracksErr } = await supabase
    .from('user_tracks')
    .upsert(trackRows, { onConflict: 'user_id,sub_skill' })

  if (tracksErr) {
    console.error('[onboarding/ielts] user_tracks upsert error:', tracksErr)
    return NextResponse.json({ error: 'Failed to seed tracks' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, redirect: '/dashboard/student' })
}
