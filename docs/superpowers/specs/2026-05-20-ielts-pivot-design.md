# IELTS Pivot — Fully Automated Test Prep Platform Design

**Date:** 2026-05-20
**Status:** Approved (brainstorm complete, awaiting implementation plan)
**Scope:** Pivot from Zambian O-Level schools product to a fully-automated IELTS prep platform launching as the only product offered.

---

## 1. Goal & scope

Re-aim the platform at IELTS test takers in Zambia + another African market. Launch presents the app as IELTS-only; the schools product is archived in place and will be re-introduced as a second product line later.

**Hard constraints:**
- The UI must not surface schools content or hint at its return. No "schools coming soon" banners, no feature-flagged subject pickers.
- Grading and content production are fully automated. No human-in-the-loop grading. Content production has a one-pass expert review gate before publish, then is hands-off.
- All four IELTS sections must be supported at launch (Listening, Reading, Writing, Speaking) for both Academic and General Training variants.

**Audience:** IELTS test takers in Zambia + one other African market (specific country TBD). Both Academic and General Training variants.

**Out of scope for V1 (parked, not lost):**
- Pricing tier definition and payment integration (Stripe vs mobile money). Functional submission limits and a hardcoded plan ladder are scaffolded so pricing can be plugged in later.
- IELTS-themed gamification reskin (badges, streak names). Existing gamification surface is kept generic.
- Notification delivery channels beyond in-app (email, push).
- Voice agent / live conversational interview simulation (deferred — currently we use TTS prompts + recorded responses, not real-time turn-taking).
- Reviving the schools product as a second product line.

---

## 2. Repo & archive plan

Archive everything Zambian-curriculum-specific in `archive/schools-v1/`, mirroring the earlier `archive/tutor-marketplace/` pattern.

**Moves into `archive/schools-v1/`:**
- Schools content: `content/`, `curriculum-materials/`.
- Schools seeds: any `sql/seed_*math*`, Fractions seed, lessons/topics rows specific to Zambia curriculum.
- The Form 1 Math personalization spec (`docs/superpowers/specs/2026-05-09-form-1-math-personalization-design.md`).
- Routes or page components referencing Mathematics/Forms/Terms by name.

**Stays in place (reused for IELTS):**
- `app/` shell, layouts, auth, dashboard scaffolding (re-skinned for IELTS).
- `lib/` block engine, track-rules, quiz engine, gamification.
- `lesson_blocks`, `lessons_new`, `track_rules`, `topics`, `tracks`, `users`, `subscriptions`, `quiz_*`, gamification tables. Their *contents* change; their *shape* mostly does not.

**Schools comes back later as a re-introduction**, not a feature-flagged toggle.

Update `docs/business-plan.md` to mark the schools product paused and IELTS as the current focus.

---

## 3. Data model

### Reused (purpose changed, shape unchanged)

- `topics` — now stores IELTS sections + sub-skills: `listening`, `reading`, `writing-task-1-academic`, `writing-task-1-general`, `writing-task-2`, `speaking-part-1`, `speaking-part-2`, `speaking-part-3`.
- `tracks` — renamed to `foundation` / `practice` / `mock`.
- `lessons_new` + `lesson_blocks` + `track_rules` — same engine, IELTS content (strategies, vocab, model answers, common mistakes).
- `quiz_*` tables — reused for in-lesson knowledge checks.

### New — the Practice Item axis

```
practice_items
  id              uuid pk
  type            text   -- 'reading_set' | 'listening_set' | 'writing_task' | 'speaking_task'
  topic_id        uuid fk -> topics.id
  variant         text   -- 'academic' | 'general' | 'both'
  difficulty_band numeric -- target band of this item (e.g. 5.0–6.5)
  criterion_tags  jsonb   -- which IELTS criteria this item exercises
  payload         jsonb   -- passage, audio_url, prompt, cue card, etc.
  status          text   -- 'draft' | 'in_review' | 'published'
  generator_version text  -- prompt-template version stamp
  created_by      uuid
  reviewed_by     uuid
  created_at      timestamptz
  published_at    timestamptz

practice_questions          -- for reading_set / listening_set
  id              uuid pk
  practice_item_id uuid fk -> practice_items.id
  position        int
  question_type   text     -- 'mcq' | 'tfng' | 'matching' | 'gap_fill' | 'short_answer' | ...
  prompt          text
  answer_key      jsonb
  accept_synonyms boolean default true

submissions
  id              uuid pk
  user_id         uuid fk -> users.id
  practice_item_id uuid fk -> practice_items.id
  started_at      timestamptz
  submitted_at    timestamptz
  payload         jsonb    -- text answer, audio_url, MCQ answers, etc.
  status          text     -- 'pending_grade' | 'graded' | 'error' | 'blocked'
  workflow_id     text nullable -- Vercel Workflow run id (Speaking only)

grades
  id              uuid pk
  submission_id   uuid fk -> submissions.id
  band_overall    numeric
  band_per_criterion jsonb   -- {task_response: 6.0, coherence: 6.5, ...}
  feedback        jsonb       -- per-criterion notes, corrections, model answer
  graded_by       text        -- 'auto-llm' | 'auto-stt-llm' | 'deterministic'
  model_version   text
  cost_cents      int
  latency_ms      int
  created_at      timestamptz

mock_tests
  id              uuid pk
  name            text
  variant         text       -- 'academic' | 'general'
  sections        jsonb      -- ordered list of practice_item_ids grouped by section
                             -- with timing rules
  curated         boolean    -- true if hand-assembled, false if generated
  created_at      timestamptz

mock_test_attempts
  id              uuid pk
  user_id         uuid fk -> users.id
  mock_test_id    uuid fk -> mock_tests.id
  started_at      timestamptz
  completed_at    timestamptz
  band_overall    numeric
  band_per_section jsonb

user_tracks                   -- per IELTS sub-skill, not per subject
  id              uuid pk
  user_id         uuid fk -> users.id
  topic_id        uuid fk -> topics.id
  track           text        -- 'foundation' | 'practice' | 'mock'
  inferred_from   text        -- 'diagnostic' | 'self_declared' | 'auto_bump'
  updated_at      timestamptz
  UNIQUE (user_id, topic_id)

calibration_set
  id              uuid pk
  item_type       text        -- 'writing_task' | 'speaking_task'
  payload         jsonb       -- the response being graded
  examiner_band_overall numeric
  examiner_band_per_criterion jsonb
  notes           text
```

### Design notes

- `submissions` and `grades` are split so a submission can be re-graded under a newer model without losing history. The UI shows the latest grade; history is auditable.
- `graded_by` + `model_version` are explicit to support calibration audits when models change.
- `mock_tests.sections` is just an ordered bundle of `practice_item_id` references; per-item graders handle each.
- `practice_items.generator_version` lets us mark a batch of generated content as suspect and exclude it from selection without deleting it.

---

## 4. Onboarding & diagnostic flow

A single ~20–25 minute wizard, gated before paid features.

### Step 1 — Questionnaire (2 min)
- IELTS variant: Academic / General Training.
- Target overall band; optional per-section targets.
- Test date (or "not booked yet").
- Self-reported current level (never tested / approx band).
- Weakest section.
- Hours per week available.
- First language (used for common-error targeting in later feedback).

### Step 2 — Placement diagnostic (15–20 min)
Not a full mock. Designed to land a defensible band per section quickly.
- **Reading** — 1 passage, 10 questions, 12 min. Deterministic grading.
- **Listening** — 1 set, 10 questions, 8 min. Deterministic grading.
- **Writing** — Task 2 only, 150-word minimum (cut from real 250), 15 min. LLM-graded.
- **Speaking** — Part 1 only, 4 questions, ~3 min recording. STT + LLM-graded.

### Step 3 — Personalized study plan
- Computed from `target_band - current_band` per section, weighted by `weakest_section` and `hours_per_week`.
- Plan is an ordered queue of Practice Items + relevant Lessons, refreshed weekly.
- `user_tracks` rows seeded per sub-skill:
  - `≤5.5` → `foundation`
  - `6.0–6.5` → `practice`
  - `≥7.0` → `mock`
- Track is per-sub-skill — a student can be `foundation` on Writing Task 2 and `mock` on Reading.

### Async grading UX
Writing + Speaking grades take 10–60s. The student sees provisional Reading + Listening bands immediately, lands on the dashboard, and receives an in-app notification when Writing + Speaking grading completes.

### Cost guard
Exactly one LLM-graded writing task and one STT+LLM speaking task per signup. ~$0.40 per signup.

### Skip path for returning test takers
"I've taken IELTS before" flow lets a student declare a recent score report and skip the diagnostic. Tracks are seeded from declared bands with lower-confidence flag.

---

## 5. Grading pipeline

All grading is server-side via Vercel Functions. Speaking uses a Vercel Workflow.

### Deterministic (Listening + Reading)
- `POST /api/submissions/:id/grade` matches answers against `practice_questions.answer_key`.
- Short-answer leniency: a small "equivalence check" LLM call decides whether `"twenty"` matches `"20"`. Cached per `(question_id, normalized_answer)`.
- Raw score → band conversion using the standard IELTS table (Academic and General use different Reading tables).
- Cost: ~$0. Latency: <500ms.

### LLM-graded (Writing)
- Endpoint accepts `{practice_item_id, response_text}`.
- Single LLM call via Vercel AI Gateway with a calibrated rubric prompt. Output: structured JSON with per-criterion band (0.5 increments), feedback strings, inline corrections (offset-based), and a model rewrite.
- Default model: Claude Sonnet 4.6 through AI Gateway; failover to GPT-4 class. Model id stored in `grades.model_version`.
- Persist the full prompt + response in `grades.feedback` for auditability.
- Cost: $0.08–0.15. Latency: 8–20s. Async UX.

### STT + LLM (Speaking) — Vercel Workflow
```
1. Receive audio upload (Supabase Storage).
2. Transcribe (Whisper via AI Gateway).
3. Pronunciation score (Azure Speech) — parallel with step 4.
4. LLM grade transcript (4 criteria) — same rubric structure as Writing.
5. Merge pronunciation + LLM scores → final band.
6. Persist grade row, emit notification.
```
- `submissions.workflow_id` tracks the run; transient failures retry with exponential backoff (max 3 attempts).
- Cost: $0.30–0.80 per session. Latency: 15–60s.

### Calibration
- `calibration_set` holds ~100 writing tasks + 50 speaking tasks pre-scored by a certified IELTS examiner.
- Nightly job re-grades the calibration set with the current model. Computes mean absolute error vs examiner scores. Alerts if MAE > 0.5 band.
- Surfaced to students as **estimated band** with a confidence note. Never advertised as a real-exam score.

### Cost guardrails (defense in depth)
- Per-tier monthly `submission_budget` for Writing and Speaking separately. Hard cap rejects new submissions with a clear message + upgrade nudge. Soft cap (80%) emits a one-time warning.
- Per-organization daily AI-Gateway spend cap (native Vercel AI Gateway feature).
- All grading endpoints rate-limited per user.
- LLM equivalence-check responses cached.

### Error handling
- Transient failures (rate limits, 5xx) → retry with backoff, max 3 attempts.
- Permanent failures (silent audio, response below min length) → `grades.status='error'` + remediation message ("audio was silent — please re-record").
- Cost-exceeded → `submissions.status='blocked'`, never calls the model.

### Re-grading
- A new `grades` row can be inserted against the same `submission_id` when a model is upgraded. Old grades retained for audit. UI shows the latest.

---

## 6. Content production loop

Turn the platform owner + a part-time IELTS expert reviewer into a content pipeline that fills the library with thin-but-real coverage of all four sections.

```
1. Author triggers generation in /admin → pick item type, topic, variant,
   target band, optional seed parameters.
2. Generator service calls AI Gateway with a typed prompt template.
   Returns a draft practice_item (status='draft') + payload + answer keys
   (Listening/Reading) + sample model answer (Writing/Speaking).
3. Automated quality checks run inline:
     - length, structure, banned phrases ("As an AI language model…")
     - self-eval rubric pass — separate LLM call scores its own draft;
       if it scores below the target band, reject
     - duplicate detection vs published items (embedding similarity)
4. Item moves to status='in_review'.
5. Reviewer opens admin queue, sees diff-style view with inline notes,
   can edit text/answers, clicks Approve → status='published'.
6. Published items become eligible for selection by the recommendation
   engine and mock-test assembly.
```

### Prompt templates
- Versioned as plain markdown under `lib/content/prompts/`.
- Each template specifies output JSON schema strictly, with examples.
- Template version stamped on every item it produces (`practice_items.generator_version`).

### Audio production (Listening)
- Generation emits a script JSON; a separate function calls TTS (ElevenLabs first, Azure failover) with voice metadata per speaker (British male, Australian female, etc. — IELTS Listening uses multiple accents).
- Audio uploaded to Supabase Storage; URL stored in `practice_items.payload.audio_url`.
- One-time cost per item, not per student.

### Reviewer experience
- `/admin/review` queue, oldest pending first.
- Side-by-side: draft on left, editable copy on right, automated-check issues highlighted.
- Approve / Reject (with reason → status='draft' for regeneration) / Edit-and-Approve.
- Reviewer edits persisted as a delta against the original draft so we can fine-tune prompts later from real correction patterns.

### V1 launch content target
- ~10 mock tests' worth of items + targeted lesson blocks.
- Concrete bank: 30 Reading sets, 30 Listening sets, 40 Writing prompts, 60 Speaking cue-cards. ~2 weeks of focused production with one reviewer.

### Lesson blocks
- Same pipeline, different prompt template family. Outputs `lesson_blocks` rows with existing tags (`foundational`, `core-full`, `worked-easy`, etc.) tuned to IELTS strategies/vocab/common-mistakes content.

---

## 7. Personalization & mock test assembly

### Per-sub-skill track inference
- `user_tracks` row per user × sub-skill.
- Initially set from the diagnostic band.
- Auto-bumped when a user's rolling 5-submission average band crosses a threshold (`≥6.0` → `practice`, `≥7.0` → `mock`). Bumps both directions.
- Drives lesson block selection (existing track-rules engine) AND practice-item difficulty selection.

### Recommendation engine — "what to study next"
A pure function: `recommendNext(user, recentGrades, time_budget) → ordered list`. Scoring prioritizes:
1. Distance from target band per section (bigger gap = higher priority).
2. Weak criterion within a section (e.g. low Lexical Resource on Writing → prefer items tagged `lexical-focus`).
3. Skill freshness (don't recommend the same item twice within N days).
4. Time budget (mix shorter Listening sets with longer Writing tasks to fit available time).

Output renders as the dashboard "Today's plan" feed — Lessons interleaved with Practice Items.

### Mock test assembly
Two kinds:
1. **Curated mocks** — hand-composed in admin, stored as `mock_tests` rows with a fixed sections payload. Used for diagnostics and "official" practice mocks.
2. **Generated mocks** — assembled on-demand by a pure function from the published Practice Item pool, respecting IELTS structure (Reading: 3 passages 40Q / Listening: 4 sets 40Q / Writing: Task 1 + Task 2 / Speaking: 3 parts).

A mock test attempt creates one submission per included Practice Item and grades them independently. Section bands averaged; overall band = standard IELTS rounding rule.

Timed UI: countdown per section, auto-submit when time expires.

---

## 8. Tech stack

- Next.js App Router (existing).
- Supabase (DB, auth, Storage for audio).
- **Vercel AI Gateway** — single endpoint for all LLM calls; provider failover; cost dashboard; no per-provider SDK lock-in.
- **Vercel Workflow** — Speaking pipeline only (genuinely durable multi-step case).
- **ElevenLabs / Azure TTS** — Listening audio production, admin-side.
- **Whisper via AI Gateway** — Speaking transcription.
- **Azure Speech** — optional pronunciation scoring.

---

## 9. Testing strategy

- **Pure functions** — recommendation engine, mock-test assembler, track inference, score-to-band conversion, response equivalence pre-check. Vitest unit tests, the way the Form 1 Math block selector is tested.
- **Grading prompts** — fixed eval set of writing/speaking samples with known examiner scores. Run on every prompt change. Fail CI if MAE drifts > 0.5 band.
- **Integration tests** — submission → grade → notification end-to-end with a stubbed AI Gateway for deterministic CI runs.
- **Browser tests** — Playwright for onboarding flow + one full mock-test attempt.

---

## 10. Open items (deferred)

- Pricing tier definition and payment integration.
- IELTS-themed gamification reskin (badge/streak naming, XP curve tuning).
- Notification delivery channels (email, push).
- Voice-agent live interview simulation.
- Schools product re-introduction strategy.

These are parked, not lost — when the time comes, each gets its own brainstorm pass.
