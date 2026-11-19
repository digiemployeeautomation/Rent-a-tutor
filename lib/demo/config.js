// lib/demo/config.js
//
// Settings for the one-click demo accounts (POST /api/demo/start).
// Pure data — safe to import anywhere.

// Every demo account uses this email domain. Clean-up code only ever deletes
// users whose email ends with it, so real students can never be touched.
export const DEMO_EMAIL_DOMAIN = 'demo.rentatutor.app'

// When more demo users than this exist, demo users older than
// DEMO_MAX_AGE_MS are deleted before a new one is created.
export const DEMO_SOFT_CAP = 300

// Absolute ceiling: if clean-up could not bring the count below this
// (a burst of sign-ups inside 24 hours), refuse new demo accounts.
export const DEMO_HARD_CAP = 600

export const DEMO_MAX_AGE_MS = 24 * 60 * 60 * 1000

// Per-IP limit on new demo accounts.
export const DEMO_RATE_LIMIT = 5
export const DEMO_RATE_WINDOW_MS = 10 * 60 * 1000

export function isDemoEmail(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith('@' + DEMO_EMAIL_DOMAIN)
}
