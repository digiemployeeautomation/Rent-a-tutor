// lib/tier-config.js

export const TIERS = {
  guided: {
    name: 'Guided',
    description: 'Relaxed pace — learn at your own speed',
    lesson_quiz: {
      pass_mark: 0,
      show_explanations: 'immediate',
      max_retries: null,
    },
    topic_test: {
      questions: 20,
      time_limit_minutes: null,
      pass_mark: 50,
      max_retries: null,
    },
    term_exam: {
      questions: 40,
      time_limit_minutes: null,
      pass_mark: 50,
      max_retries: null,
      format: 'by_topic',
    },
  },
  balanced: {
    name: 'Balanced',
    description: 'Recommended — pushes you without blocking you',
    lesson_quiz: {
      pass_mark: 60,
      show_explanations: 'after_submit',
      max_retries: 3,
    },
    topic_test: {
      questions: 30,
      time_limit_minutes: 45,
      pass_mark: 60,
      max_retries: 3,
    },
    term_exam: {
      questions: 60,
      time_limit_minutes: 90,
      pass_mark: 60,
      max_retries: 2,
      format: 'exam_sections',
    },
  },
  exam_ready: {
    name: 'Exam Ready',
    description: 'Strict — real exam pressure to prepare you',
    lesson_quiz: {
      pass_mark: 80,
      show_explanations: 'after_pass',
      max_retries: null,
    },
    topic_test: {
      questions: 40,
      time_limit_minutes: 30,
      pass_mark: 75,
      max_retries: null,
    },
    term_exam: {
      questions: 80,
      time_limit_minutes: 60,
      pass_mark: 75,
      max_retries: null,
      format: 'ecz_exam',
    },
  },
}

export const DEFAULT_TIER = 'balanced'

export function getTierConfig(tierName) {
  return TIERS[tierName] || TIERS[DEFAULT_TIER]
}
