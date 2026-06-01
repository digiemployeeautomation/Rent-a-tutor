// lib/grading/writing.js
//
// Writing grader (AI). Extracted from the grade route so the route is a thin
// dispatcher and each item type owns its grading logic. Returns the
// normalized grade-row fields the route persists.

import { stubGradeWriting } from '@/lib/ai/stub-grader'
import { gradeWriting, WRITING_GRADER_VERSION } from '@/lib/ai/gateway'

export async function gradeWritingSubmission(item, submission, { isStub } = {}) {
  const taskPrompt = item.payload?.prompt ?? ''
  const responseText = submission.payload?.response_text ?? ''

  if (isStub) {
    const grade = stubGradeWriting({ taskType: item.sub_skill, taskPrompt, responseText })
    return {
      band_overall: grade.band_overall,
      band_per_criterion: grade.band_per_criterion,
      feedback: {
        per_criterion: grade.feedback,
        corrections: grade.corrections,
        model_rewrite: grade.model_rewrite,
      },
      graded_by: 'stub',
      model_version: `stub@${WRITING_GRADER_VERSION}`,
      cost_cents: null,
      latency_ms: null,
    }
  }

  const { grade, meta } = await gradeWriting({
    taskType: item.sub_skill,
    variant: item.variant,
    taskPrompt,
    responseText,
  })
  return {
    band_overall: grade.band_overall,
    band_per_criterion: grade.band_per_criterion,
    feedback: {
      per_criterion: grade.feedback,
      corrections: grade.corrections,
      model_rewrite: grade.model_rewrite,
    },
    graded_by: 'auto-llm',
    model_version: meta.model_version,
    cost_cents: meta.cost_cents,
    latency_ms: meta.latency_ms,
  }
}
