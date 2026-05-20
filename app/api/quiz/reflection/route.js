// app/api/quiz/reflection/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { verifyCsrf } from '@/lib/csrf'
import { gradeReflection } from '@/lib/quiz-grading'
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
      return NextResponse.json({ error: 'You must be logged in to submit a reflection.' }, { status: 401 })
    }

    const { quizId, response } = await request.json()

    if (!quizId || typeof response !== 'string' || !response.trim()) {
      return NextResponse.json({ error: 'quizId and response are required.' }, { status: 400 })
    }

    // 3. Fetch quiz from quizzes table
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('id, lesson_id, topic_id, term_id, subject_id, quiz_type, tier_config')
      .eq('id', quizId)
      .single()

    if (quizErr || !quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 })
    }

    // 4. Fetch the single free_form question
    const { data: question, error: questionErr } = await supabase
      .from('quiz_questions')
      .select('id, type, options, points')
      .eq('quiz_id', quizId)
      .eq('type', 'free_form')
      .single()

    if (questionErr || !question) {
      return NextResponse.json({ error: 'Reflection question not found.' }, { status: 404 })
    }

    // 5. The question's options JSONB stores key points as:
    //    [{ "description": "...", "keywords": ["...", "..."] }]
    const keyPoints = Array.isArray(question.options) ? question.options : []

    // 6. Call gradeReflection
    const { coveredPoints, missedPoints, totalPoints, coveredCount } = gradeReflection(response, keyPoints)

    // 7. Insert quiz_attempts row with feedback JSONB containing the reflection result
    const { error: insertErr } = await supabase
      .from('quiz_attempts')
      .insert({
        student_id:    user.id,
        quiz_id:       quizId,
        score:         coveredCount,
        max_score:     totalPoints,
        passed:        true, // Reflection always passes
        answers:       [{ questionId: question.id, answer: response }],
        feedback:      { coveredPoints, missedPoints, totalPoints, coveredCount },
        completed_at:  new Date().toISOString(),
      })

    if (insertErr) {
      console.error('[quiz/reflection POST] insert attempt:', insertErr)
      return NextResponse.json({ error: 'Failed to save reflection attempt.' }, { status: 500 })
    }

    // 8. Award XP (reflection always awards — it can't fail)
    const xpAmount = calculateXPAward('pass_lesson_quiz', { isFirstAttempt: true })

    const { error: xpErr } = await supabase.rpc('increment_xp', {
      p_user_id: user.id,
      p_amount:  xpAmount,
    })
    if (xpErr) console.error('[quiz/reflection] increment_xp failed:', xpErr)

    // 9. Record activity
    const { error: actErr } = await supabase.rpc('record_activity', { p_user_id: user.id })
    if (actErr) console.error('[quiz/reflection] record_activity failed:', actErr)

    // 10. Return result
    return NextResponse.json({ coveredPoints, missedPoints, totalPoints, coveredCount })

  } catch (err) {
    console.error('[quiz/reflection POST]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
