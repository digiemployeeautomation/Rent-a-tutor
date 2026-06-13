// lib/grading/index.js
//
// Grader registry — the seam that lets each section plug in its grader
// without touching the grade route. Adding a section = one line here.
//
// A grader has the signature:
//   async (item, submission, deps) => gradeRowFields
// where deps = { admin, isStub } and gradeRowFields matches the `grades`
// table columns (band_overall, band_per_criterion, feedback, graded_by,
// model_version, cost_cents, latency_ms).

import { gradeWritingSubmission } from './writing.js'
import { gradeDeterministicSubmission } from './deterministic.js'
import { gradeSpeakingSubmission } from './speaking.js'

const GRADERS = {
  writing_task: gradeWritingSubmission,
  reading_set: gradeDeterministicSubmission,
  listening_set: gradeDeterministicSubmission,
  speaking_task: gradeSpeakingSubmission,
}

export function getGrader(type) {
  return GRADERS[type] ?? null
}

export function isGradable(type) {
  return Object.prototype.hasOwnProperty.call(GRADERS, type)
}

// graded_by label to stamp when grading FAILS and the route persists an error
// grade row. The grader never returned its own label in that case, so we derive
// it from the item type. Mirrors each grader's success-path graded_by so the
// audit trail is consistent (a failed speaking grade reads 'auto-stt-llm', not
// 'deterministic'). Reading/Listening are always deterministic — never stub.
export function errorGradedBy(itemType, isStub) {
  switch (itemType) {
    case 'writing_task':  return isStub ? 'stub' : 'auto-llm'
    case 'speaking_task': return isStub ? 'stub' : 'auto-stt-llm'
    case 'reading_set':
    case 'listening_set': return 'deterministic'
    default:              return 'unknown'
  }
}
