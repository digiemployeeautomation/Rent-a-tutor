// lib/subscription.js

/**
 * Check if a student has an active subscription that covers
 * the given subject + form + term combination.
 *
 * Plan coverage:
 * - 'subject' plan: covers 1 subject, 1 form, 1 term
 * - 'term' plan: covers ALL subjects, 1 form, 1 term
 * - 'form' plan: covers ALL subjects, 1 form, ALL terms
 */
export async function hasAccess(supabase, studentId, { subjectId, formId, termId }) {
  const now = new Date().toISOString()

  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, plan_type, subject_id, form_id, term_id')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .gte('expires_at', now)

  if (error || !subs || subs.length === 0) return false

  return subs.some(sub => {
    if (sub.plan_type === 'form') {
      return sub.form_id === formId
    }
    if (sub.plan_type === 'term') {
      return sub.form_id === formId && sub.term_id === termId
    }
    if (sub.plan_type === 'subject') {
      return sub.form_id === formId && sub.term_id === termId && sub.subject_id === subjectId
    }
    return false
  })
}

/**
 * Get all active subscriptions for a student.
 */
export async function getActiveSubscriptions(supabase, studentId) {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, subjects_new(name, slug), forms(name, level), terms(name, number)')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .gte('expires_at', now)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

/**
 * Calculate subscription duration and expiry based on plan type.
 */
export function getSubscriptionDuration(planType) {
  switch (planType) {
    case 'subject': return { months: 1, label: '1 month' }
    case 'term':    return { months: 4, label: '4 months' }
    case 'form':    return { months: 12, label: '12 months' }
    default:        return { months: 1, label: '1 month' }
  }
}
