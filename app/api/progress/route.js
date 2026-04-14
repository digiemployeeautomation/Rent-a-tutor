// app/api/progress/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { verifyCsrf } from '@/lib/csrf'
import { calculateXPAward } from '@/lib/xp'

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
      return NextResponse.json({ error: 'You must be logged in to record progress.' }, { status: 401 })
    }

    const { lessonId, sectionId } = await request.json()

    if (!lessonId || !sectionId) {
      return NextResponse.json({ error: 'lessonId and sectionId are required.' }, { status: 400 })
    }

    // 3. Upsert into student_progress with ON CONFLICT DO NOTHING behavior
    const { error: upsertErr } = await supabase
      .from('student_progress')
      .upsert(
        {
          student_id: user.id,
          lesson_id:  lessonId,
          section_id: sectionId,
        },
        { onConflict: 'student_id,lesson_id,section_id', ignoreDuplicates: true }
      )

    if (upsertErr) {
      console.error('[progress POST] upsert:', upsertErr)
      return NextResponse.json({ error: 'Failed to record progress.' }, { status: 500 })
    }

    // 4. Record activity
    await supabase.rpc('record_activity', { p_user_id: user.id })

    // 5. Award section completion XP
    const xpAmount = calculateXPAward('complete_section')

    await supabase.rpc('increment_xp', {
      p_user_id: user.id,
      p_amount:  xpAmount,
    })

    // 6. Return success
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[progress POST]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
