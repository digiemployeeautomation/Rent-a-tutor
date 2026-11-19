// lib/demo/seed.js
//
// SERVER-ONLY. Gives a brand-new demo account a believable starting state so
// the dashboard is not empty: an IELTS goal, a few high-school quiz results
// and (best effort) one real, deterministically graded reading drill.
// All writes use the service-role client passed in by the caller.
import { getAllLessons } from '@/lib/highschool/catalog'
import { isPassed } from '@/lib/highschool/subjects'
import { initialUserTracks } from '@/lib/ielts/onboarding'
import { gradeDeterministicSubmission } from '@/lib/grading/deterministic'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

// Sample quiz results: [lesson id, score, hours ago]. Totals come from the
// lesson's real quiz length, so the numbers always match the lesson.
const HS_RESULTS = [
  ['mathematics-fractions-1', 7, 4 * DAY + 3 * HOUR],
  ['mathematics-fractions-2', 6, 3 * DAY + 5 * HOUR],
  ['biology-nervous-system-1', 8, 2 * DAY + 2 * HOUR],
  ['mathematics-fractions-3', 4, 1 * DAY + 4 * HOUR], // attempted, not passed yet
]

// First reading drill (True / False / Not Given). Preset answers by question
// position; the 4th is deliberately wrong so the result looks like a real try.
const READING_DRILL_ID = '33333333-3333-4333-8333-333333333333'
const READING_ANSWERS_BY_POSITION = { 1: 'TRUE', 2: 'FALSE', 3: 'NOT GIVEN', 4: 'NOT GIVEN', 5: 'NOT GIVEN' }

function isoAgo(ms) {
  return new Date(Date.now() - ms).toISOString()
}

function dateInDays(days) {
  return new Date(Date.now() + days * DAY).toISOString().slice(0, 10)
}

export async function seedDemoAccount(admin, userId) {
  const profile = {
    variant: 'academic',
    target_band: 7.0,
    test_date: dateInDays(70),
    current_band_self: 6.0,
    weakest_section: 'writing',
    hours_per_week: 5,
    first_language: null,
  }

  const { error: profileErr } = await admin
    .from('user_ielts_profile')
    .upsert({ user_id: userId, ...profile, per_section_target: null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (profileErr) throw new Error(`profile: ${profileErr.message}`)

  const tracks = initialUserTracks(profile).map((t) => ({ user_id: userId, ...t, updated_at: new Date().toISOString() }))
  const { error: tracksErr } = await admin.from('user_tracks').upsert(tracks, { onConflict: 'user_id,sub_skill' })
  if (tracksErr) console.warn('[demo/seed] user_tracks:', tracksErr.message)

  const lessonsById = new Map(getAllLessons().map((l) => [l.id, l]))
  const progress = HS_RESULTS
    .filter(([id]) => lessonsById.has(id))
    .map(([id, score, ago]) => {
      const total = lessonsById.get(id).quiz?.length || 8
      const s = Math.min(score, total)
      return { user_id: userId, lesson_id: id, score: s, total, passed: isPassed(s, total), attempts: 1, completed_at: isoAgo(ago) }
    })
  if (progress.length > 0) {
    const { error: hsErr } = await admin.from('hs_lesson_progress').upsert(progress, { onConflict: 'user_id,lesson_id' })
    if (hsErr) throw new Error(`hs progress: ${hsErr.message}`)
  }

  try {
    await seedReadingDrill(admin, userId)
  } catch (err) {
    // Optional extra — the account is still usable without it.
    console.warn('[demo/seed] reading drill skipped:', err.message)
  }
}

async function seedReadingDrill(admin, userId) {
  const { data: item, error: itemErr } = await admin
    .from('practice_items')
    .select('id, type, sub_skill, variant, payload, status')
    .eq('id', READING_DRILL_ID)
    .maybeSingle()
  if (itemErr || !item || item.status !== 'published') throw new Error('drill not available')

  const { data: questions, error: qErr } = await admin
    .from('practice_questions')
    .select('id, position')
    .eq('practice_item_id', item.id)
  if (qErr || !questions?.length) throw new Error('drill has no questions')

  const answers = {}
  for (const q of questions) {
    if (READING_ANSWERS_BY_POSITION[q.position]) answers[q.id] = READING_ANSWERS_BY_POSITION[q.position]
  }

  const at = isoAgo(5 * HOUR)
  const { data: submission, error: subErr } = await admin
    .from('submissions')
    .insert({ user_id: userId, practice_item_id: item.id, payload: { answers }, status: 'pending_grade', started_at: isoAgo(5 * HOUR + 12 * 60 * 1000), submitted_at: at })
    .select('id, payload')
    .single()
  if (subErr) throw new Error(subErr.message)

  // The same grader the real "Check answers" flow uses.
  const fields = await gradeDeterministicSubmission(item, submission, { admin })
  const { error: gradeErr } = await admin.from('grades').insert({ submission_id: submission.id, ...fields, created_at: at })
  if (gradeErr) throw new Error(gradeErr.message)
  await admin.from('submissions').update({ status: 'graded' }).eq('id', submission.id)
}
