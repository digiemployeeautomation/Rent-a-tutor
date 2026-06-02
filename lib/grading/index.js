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
