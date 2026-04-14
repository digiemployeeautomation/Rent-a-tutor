// lib/xp.js

export const XP_REWARDS = {
  complete_section: 10,
  pass_lesson_quiz: 25,
  pass_topic_test: 100,
  pass_term_exam: 500,
  first_attempt_bonus: 10,
  perfect_score_bonus: 25,
  streak_milestone_bonus: 50,
}

export const LEVELS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2100,   // Level 7
  2800,   // Level 8
  3600,   // Level 9
  4500,   // Level 10
  5500,   // Level 11
  6600,   // Level 12
  7800,   // Level 13
  9100,   // Level 14
  10500,  // Level 15
]

export function getLevelForXP(xp) {
  let level = 1
  for (let i = 1; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i]) {
      level = i + 1
    } else {
      break
    }
  }
  return level
}

export function getXPForNextLevel(xp) {
  const currentLevel = getLevelForXP(xp)
  if (currentLevel >= LEVELS.length) return null
  return LEVELS[currentLevel] - xp
}

export function calculateXPAward(action, { isFirstAttempt = false, isPerfectScore = false } = {}) {
  let xp = XP_REWARDS[action] || 0
  if (isFirstAttempt) xp += XP_REWARDS.first_attempt_bonus
  if (isPerfectScore) xp += XP_REWARDS.perfect_score_bonus
  return xp
}
