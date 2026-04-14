// app/api/quiz/submit/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { verifyCsrf } from '@/lib/csrf'
import { gradeQuiz } from '@/lib/quiz-grading'
import { calculateXPAward } from '@/lib/xp'

const QUIZ_TYPE_TO_XP_ACTION = {
  lesson_quiz:  'pass_lesson_quiz',
  topic_test:   'pass_topic_test',
  term_exam:    'pass_term_exam',
}

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
      return NextResponse.json({ error: 'You must be logged in to submit a quiz.' }, { status: 401 })
    }

    const { quizId, answers } = await request.json()

    if (!quizId || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'quizId and answers are required.' }, { status: 400 })
    }

    // 3. Fetch quiz from quizzes table (with tier_config)
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('id, lesson_id, topic_id, term_id, subject_id, quiz_type, tier_config')
      .eq('id', quizId)
      .single()

    if (quizErr || !quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 })
    }

    // 4. Fetch quiz questions ordered by "order"
    const { data: questions, error: questionsErr } = await supabase
      .from('quiz_questions')
      .select('id, type, question_text, options, correct_answer, explanation, points, order')
      .eq('quiz_id', quizId)
      .order('order', { ascending: true })

    if (questionsErr || !questions) {
      return NextResponse.json({ error: 'Failed to load quiz questions.' }, { status: 500 })
    }

    // 5. Get student's learning_tier from student_profiles
    const { data: profile, error: profileErr } = await supabase
      .from('student_profiles')
      .select('learning_tier')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 })
    }

    const tier = profile.learning_tier

    // 6. Get pass_mark from the quiz's tier_config for the student's tier
    const tierConfig = quiz.tier_config?.[tier] ?? {}
    const passMark = tierConfig.pass_mark ?? 60

    // 7. Call gradeQuiz
    const { score, maxScore, percentage, passed, results } = gradeQuiz(questions, answers, passMark)

    // 8. Count previous attempts to determine attempt_number
    const { count: prevAttempts } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('quiz_id', quizId)

    const attemptNumber = (prevAttempts ?? 0) + 1
    const isFirstAttempt = attemptNumber === 1
    const isPerfectScore = percentage === 100

    // 9. Insert quiz_attempts row
    const { error: insertErr } = await supabase
      .from('quiz_attempts')
      .insert({
        student_id:    user.id,
        quiz_id:       quizId,
        tier,
        score,
        max_score:     maxScore,
        passed,
        answers:       answers,
        feedback:      results,
        completed_at:  new Date().toISOString(),
        attempt_number: attemptNumber,
      })

    if (insertErr) {
      console.error('[quiz/submit POST] insert attempt:', insertErr)
      return NextResponse.json({ error: 'Failed to save quiz attempt.' }, { status: 500 })
    }

    // 10. If passed: award XP
    if (passed) {
      const action = QUIZ_TYPE_TO_XP_ACTION[quiz.quiz_type] ?? 'pass_lesson_quiz'
      const xpAmount = calculateXPAward(action, { isFirstAttempt, isPerfectScore })

      await supabase.rpc('increment_xp', {
        p_user_id: user.id,
        p_amount:  xpAmount,
      })
    }

    // 11. Record activity
    await supabase.rpc('record_activity', { p_user_id: user.id })

    // 12. Filter explanations based on tier's show_explanations setting
    const showExplanations = tierConfig.show_explanations

    const filteredResults = results.map(r => {
      const includeExplanation =
        showExplanations === 'immediate' ||
        showExplanations === 'after_submit' ||
        (showExplanations === 'after_pass' && passed)

      return {
        questionId:    r.questionId,
        correct:       r.correct,
        studentAnswer: r.studentAnswer,
        correctAnswer: r.correctAnswer,
        points:        r.points,
        ...(includeExplanation ? { explanation: r.explanation } : {}),
      }
    })

    // 13. Return result
    return NextResponse.json({
      score,
      maxScore,
      percentage,
      passed,
      results:       filteredResults,
      attemptNumber,
    })

  } catch (err) {
    console.error('[quiz/submit POST]', err)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
