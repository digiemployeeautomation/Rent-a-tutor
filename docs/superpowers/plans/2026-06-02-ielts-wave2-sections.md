# IELTS Wave 2 — The Four Sections

**Date:** 2026-06-02
**Status:** In progress
**Roadmap:** `docs/superpowers/plans/2026-06-01-ielts-full-build-roadmap.md` (Wave 2)
**Branch:** `feat/ielts-wave1-engine` (continues into Wave 2)

Wave 1 shipped the registry seams (grader registry, question-type registry, section
descriptor, the 3 question primitives, deterministic grading core, band tables, audio
storage helpers). Wave 2 plugs the four IELTS sections into those seams. Each section
adds its own route subtree + section-specific code and makes at most two shared-file
edits: flip its `ready` flag in `lib/ielts/sections.js`, and (Speaking only) register
its grader in `lib/grading/index.js`. Those two shared edits are done during
integration, not by the section work, so parallel tracks never collide.

## Data contracts (from Wave 1)

- **Submission payload** for Reading/Listening: `{ answers: { [questionId]: value } }`
  where value is a string (single_select / text_fill) or string[] (multi_select).
- **Submission payload** for Speaking: `{ audio_path, transcript? }` (audio uploaded
  server-side first; path stored on the submission).
- **Question options** resolution: registry `fixedOptions` (TFNG/YNNG) take precedence;
  otherwise `practice_questions.options.choices` (migration 007) for select types.
- **Deterministic grade feedback** shape: `{ per_question, raw_score, total, percentage }`
  (see `lib/grading/deterministic.js`). `band_overall` is null for a single set.
- **AI grade** shape: `{ band_overall, band_per_criterion, feedback:{ per_criterion,... } }`.
- Grade route owns auth/ownership/idempotency/persistence; graders return grade-row fields.

## Track A — Reading + Listening

- Shared `components/practice/QuestionSetRunner.js` (client): loads questions for an item
  (RLS-readable columns only — NO answer_key), renders each via SingleSelect / MultiSelect
  / TextFill chosen by the question-type registry, collects answers, POSTs a submission,
  triggers grade, navigates to the result page.
- `app/practice/reading/[itemId]/page.js` (server) + `result/[submissionId]/page.js`.
- `app/practice/listening/[itemId]/page.js` (server, signs the audio URL via service role
  and renders `components/practice/AudioPlayer.js` above the runner) + result page.
- Result pages render the deterministic per-question review (correct/your answer/correct
  answer, raw score, percentage).
- Seeds: `supabase/seed/seed_ielts_reading_demo.sql`, `seed_ielts_listening_demo.sql`
  covering the primitives across several question types.
- Deterministic grader already registered for `reading_set` + `listening_set`.

## Track B — Speaking

- `components/practice/Recorder.js` (client): MediaRecorder capture, playback preview,
  upload to a server route, then submit + grade + navigate to result.
- `app/api/submissions/[id]/audio/route.js` (server): validates ownership, uploads the
  blob to the private `submission-audio` bucket via service role, stamps `audio_path`
  onto the submission payload. Avoids client-side storage RLS.
- `lib/ai/stt.js`: Whisper transcription via the AI Gateway audio endpoint, with a stub
  fallback under `USE_STUB_GRADER` (mirrors the writing stub).
- `lib/grading/speaking.js`: STT → LLM grade (speaking rubric prompt
  `lib/content/prompts/speaking-grader-v1.md`), returns grade-row fields. Structured to
  move into a Vercel Workflow later (the `workflow_id` column already exists); synchronous
  through the existing grade route for now.
- `app/practice/speaking/[itemId]/page.js` + `result/[submissionId]/page.js`.
- Seed: `supabase/seed/seed_ielts_speaking_demo.sql` (Parts 1–3 prompts).

## Track C — Writing Task 1 (handled during integration)

- The existing Writing flow + `writing-grader-v1.md` already handle Task 1
  (Academic + General) via `{{TASK_TYPE}}` and the 150-word rule. Only seed content is
  needed: `supabase/seed/seed_ielts_writing_task1_demo.sql` (one Academic chart task, one
  General letter task). Flip nothing — `writing_task` is already `ready`.

## Integration (after tracks A + B)

1. Flip `ready: true` for `reading_set`, `listening_set`, `speaking_task` in
   `lib/ielts/sections.js`.
2. Register `speaking_task → gradeSpeakingSubmission` in `lib/grading/index.js`.
3. Add Writing Task 1 seeds.
4. Run `npm test` (full Vitest suite) + `npm run build`; fix integration issues.
5. Commit. Review gate before Wave 3.

## Out of scope (gated — per roadmap)

- The full content bank (30/30/40/60). Seeds here are small demo sets only.
- Real Listening TTS audio (Wave 3) — seeds reference placeholder audio paths.
- AI grading calibration data.
- Vercel Workflow durability wrapper for Speaking (built workflow-ready; upgrade later).
