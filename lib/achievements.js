/**
 * Check and award achievements after an action.
 * Call this after quiz completion, lesson completion, etc.
 */
export async function checkAchievements(supabase, studentId, action) {
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*')

  const { data: earned } = await supabase
    .from('student_achievements')
    .select('achievement_id')
    .eq('student_id', studentId)

  const earnedIds = new Set((earned || []).map(e => e.achievement_id))
  const newAchievements = []

  for (const achievement of (allAchievements || [])) {
    if (earnedIds.has(achievement.id)) continue

    const met = await checkCriteria(supabase, studentId, achievement, action)
    if (met) {
      await supabase.from('student_achievements').insert({
        student_id: studentId,
        achievement_id: achievement.id,
      })
      newAchievements.push(achievement)
    }
  }

  return newAchievements
}

async function checkCriteria(supabase, studentId, achievement, action) {
  const { criteria_type, criteria_value } = achievement

  switch (criteria_type) {
    case 'lessons_completed': {
      const { count } = await supabase
        .from('student_progress')
        .select('lesson_id', { count: 'exact', head: true })
        .eq('student_id', studentId)
      return (count || 0) >= criteria_value.count
    }
    case 'perfect_quiz': {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('student_id', studentId)
        .eq('passed', true)
      const perfectCount = (data || []).length
      return perfectCount >= criteria_value.count
    }
    case 'streak': {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('current_streak')
        .eq('user_id', studentId)
        .single()
      return (profile?.current_streak || 0) >= criteria_value.days
    }
    case 'first_attempt_pass': {
      const { count } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('attempt_number', 1)
        .eq('passed', true)
      return (count || 0) >= criteria_value.count
    }
    case 'topic_complete': {
      // Simplified: check if any topic has all its lessons completed
      return false // Will be enhanced when topic completion tracking is added
    }
    case 'term_complete': {
      // Simplified: check if any term has all topics completed
      return false // Will be enhanced when term completion tracking is added
    }
    default:
      return false
  }
}
