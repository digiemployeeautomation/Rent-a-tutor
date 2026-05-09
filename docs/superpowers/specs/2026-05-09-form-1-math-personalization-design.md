# Form 1 Mathematics — Personalized Learning Design

**Date:** 2026-05-09
**Status:** Approved (brainstorm complete, awaiting implementation plan)
**Scope:** Proof-of-concept covering Form 1 Mathematics (all 3 terms), slides-only.

---

## 1. Goal & scope

Build a personalized learning experience for Form 1 Mathematics that adapts to each student's learning context, prior knowledge, and goal — without requiring AI runtime, video production, or an authoring team beyond the existing one.

**Hard constraint:** every student must be exposed to 100% of the curriculum facts. Personalization changes the *path*, *depth of build-up*, and *focus of practice* — never the curriculum coverage.

**Out of scope for V1:**
- Video lessons (cost)
- AI-generated content of any kind, including runtime AI tutors (cost)
- Interest-tagged "Voice" variants of slides — i.e., the same slide rewritten with sport/cooking/music examples (no team to author)
- Subjects other than Mathematics (deferred to V2)
- Forms other than Form 1 (deferred to V2)
- Modular slide atoms (Approach 3) — overkill at PoC scale

---

## 2. Personalization model

### Three tracks

Each topic is delivered through one of three tracks that select different blocks from the same lesson pool. The track names map directly to the existing tier system in `lib/tier-config.js`.

| Track | Existing tier | Intended student | Block sequence |
|---|---|---|---|
| **Learner** | `guided` | First-time, struggling, low confidence | foundational → core-full → worked-easy → worked-medium → practice → recap |
| **Reviser** | `balanced` | Knows the topic, needs a refresh | core-summary → worked-medium → practice → recap |
| **Exam-prep** | `exam_ready` | Already learned, preparing for exam | core-summary → worked-hard → common-mistakes → past-paper-style practice |

All three end at the same mastery point. None skips curriculum facts.

### Track resolution (most-specific wins)

Each student profile carries three levels of tier preference:
- `default_tier` — set by global onboarding (Stage 1)
- `subject_tier[math]` — set by per-subject onboarding (Stage 2)
- `topic_tier[math.<topic-slug>]` — set by per-topic micro-intake (Stage 3)

The system uses the most-specific value available. A student can be **Reviser** for Math overall but **Learner** for Fractions only.

### Performance-driven adjustment

After every quiz, the system recalculates:

- **Track bumps (per topic):**
  - A Reviser who fails the first quiz on a topic drops to Learner *for that topic only*.
  - A struggling Learner who passes practice consistently can be promoted to Reviser for that topic.
  - Bumps require ≥ 2 data points to avoid noise (TBD threshold).
- **Topic weights for next test/exam:** topics with low scores get higher weight in the next test/exam sample. No topic ever drops to zero weight.
- **Difficulty calibration:** running average of correctness drives the next question's difficulty draw within `worked-medium` / `worked-hard` ranges.

---

## 3. Lesson structure: block-tag-and-select

Each lesson is **one** authored unit composed of tagged blocks. The author writes once; the renderer selects per-track.

### Block tags

| Tag | Purpose |
|---|---|
| `foundational` | Why this matters; prerequisite recap |
| `core-full` | Full teaching of the rule/formula/concept |
| `core-summary` | One-slide condensation of the same rule |
| `worked-easy` | Worked example at low difficulty |
| `worked-medium` | Worked example at standard difficulty |
| `worked-hard` | Worked example at high/exam-paper difficulty |
| `practice` | Problems for the student to attempt |
| `common-mistakes` | Exam-style traps and frequent errors |
| `recap` | Summary at the end |

A lesson may have multiple instances of any tag (e.g., several `worked-medium` blocks). The renderer picks an appropriate count per track.

### Authoring workflow

When authoring a topic lesson:
1. Write the canonical content (foundational → core-full).
2. Write a `core-summary` (1 slide condensation).
3. Write 1–2 worked examples per difficulty (easy/medium/hard).
4. Write 3–5 practice problems.
5. Write a `common-mistakes` block (1–2 slides).
6. Write a `recap` block.

This is incremental authoring on top of a single canonical lesson — not three separate lesson versions.

---

## 4. Onboarding — three stages

### Stage 1 — Global (at signup, 10 questions)

Asked once. Determines `default_tier` and stores profile data used across all subjects.

**Who they are (2):**
1. What do you want to be when you finish school? *(category list — doctor, engineer, teacher, business, sports, creative, undecided)*
2. What languages do you speak at home? *(multi-select)*

**How they learn (5, drawn from existing `lib/personality.js`):**
3. When you get a question wrong, what do you prefer? *(immediate / after submission / try myself first)*
4. How do you feel before an exam? *(very anxious / a bit nervous / excited)*
5. How often do you study? *(when I feel like it / a few times a week / every day)*
6. When stuck, what do you do? *(ask right away / try then ask / keep trying)*
7. How do you handle failing a test? *(it discourages me / I review and move on / it motivates me)*

**Goals (3):**
8. When is your next big exam? *(within a month / 1–3 months / 3–6 months / 6–12 months / none)*
9. What grade are you aiming for? *(just to pass / 60–70% / 80%+ / top of class)*
10. How many hours can you study per week? *(<3 / 3–7 / 7–14 / >14)*

### Stage 2 — Per subject (4 questions, on first subject access)

Asked once per subject the student has access to. Determines `subject_tier[<subject>]`.

1. Have you studied this subject before? *(no / yes, recently / yes, a while ago)*
2. What was your last grade in this subject? *(<40% / 40–59% / 60–74% / 75%+ / N/A)*
3. Any topics in this subject you find difficult? *(checklist generated from the curriculum's topics for this subject and form)*
4. Why are you studying this subject now? *(school requirement / passion / career / preparing for exam)*

### Stage 3 — Per topic (1 micro-question, on first topic access)

Asked once per topic the student opens. Determines `topic_tier[<subject>.<topic>]`.

> Have you studied [Topic Name] before?
> - No, new to me → **Learner**
> - Yes, just refreshing → **Reviser**
> - Yes, preparing for exam → **Exam-prep**

---

## 5. Tests & exams

Three layered personalizations on top of the existing tier rules in `lib/tier-config.js` (number of questions, time limit, pass mark, retries, format):

### 5a. Topic-weighted draws

Questions sample more heavily from the student's weak topics and less from strong ones. Every topic still receives some coverage — never zero.

Weight inputs:
- Per-subject Stage 2 difficulty checklist (initial weights)
- Running quiz/test performance per topic (ongoing weights)

### 5b. Adaptive difficulty

Within a topic, the test composer draws easier or harder questions based on the student's running correctness average for that topic. Difficulty buckets: `easy` / `medium` / `hard` (matching the worked-example tags).

### 5c. Track-aware wrong-answer feedback

| Track | What appears on a wrong answer |
|---|---|
| Learner | Full step-by-step explanation |
| Reviser | One-line correction + correct answer |
| Exam-prep | Common-mistake tag + brief reasoning |

### Question bank metadata

Every question carries:
- `topic_id`
- `concept` (sub-topic / specific skill)
- `difficulty` (`easy` / `medium` / `hard`)
- `common_mistake_tags[]` (free-form labels referenced by Exam-prep feedback)

---

## 6. Data model implications

The current schema (see `supabase/migrations/001_platform_redesign.sql`) needs the following additions/changes. **Detailed schema design is left to the implementation plan.**

### Lessons & blocks
- `lesson_sections` currently models `type IN ('video', 'slides')` with `slides_data JSONB`. This needs replacement or extension to support a block pool with tags.
- Likely new table `lesson_blocks` with columns for `lesson_id`, `tag`, `order_within_tag`, `slides_data JSONB`.

### Student profile
- New table or columns to store:
  - Stage 1 answers (10 question responses)
  - Stage 2 answers per subject
  - Stage 3 answers per topic
  - Resolved tier values: `default_tier`, `subject_tier[]`, `topic_tier[]`
  - Running performance metrics per topic (mean correctness, last 5 scores)

### Question bank
- New table `questions` (or extension of existing) with `topic_id`, `concept`, `difficulty`, `common_mistake_tags`, `body`, `correct_answer`, `explanation`.
- Existing `quizzes` table remains as the assessment shell; questions are drawn from the bank by composer.

### Track resolver
- A function (DB or app-layer) that takes `(student_id, subject_id, topic_id)` and returns the active track using the most-specific-wins rule.

---

## 7. Open questions for the implementation plan

These were identified during brainstorm but deliberately not resolved here. The implementation plan should address them:

1. **Schema migration approach** — additive vs. replacing `lesson_sections` and `slides_data`.
2. **Threshold values** for performance-driven track bumps (how many failures before drop, how many passes before promotion).
3. **Topic weight algorithm** — exact formula for translating performance + intake into draw weights.
4. **UI for Stage 3 micro-intake** — modal? Inline? First-time-only marker per topic.
5. **Backfill of existing content** — does the one Form 4 Biology lesson get retro-fitted to the new block model, or does it stay legacy?
6. **Authoring tooling** — does the admin interface need updates to support the block-tag workflow, or do we author directly in JSON for the PoC?
7. **Question bank seeding** — how many questions per topic do we need to seed before V1 ships? (Topic-weighted draws are weak with too few questions per topic.)

---

## 8. Success criteria

The PoC is successful if:

- A new student completes Stage 1 onboarding in under 5 minutes.
- The student opens Math, completes Stage 2 onboarding in under 90 seconds.
- The student opens Fractions (Topic 1) and is correctly assigned a track via Stage 3 in under 15 seconds.
- The student sees a different sequence of slides than another student on a different track for the same topic.
- After failing a Fractions quiz, the student is auto-bumped to a more supportive track (or sees additional scaffolding) within the same session.
- A topic test draws more heavily from the student's flagged-weak topics.
- All 3 tracks cover the full curriculum on every topic (verifiable: no curriculum fact lives only in one track's blocks).

---

## 9. What this design intentionally is not

- **Not a Voice/AI personalization system.** Slides within a track look the same for every student on that track. Personalization is in *which* slides they see and *how* their tests behave, not in the wording.
- **Not a recommendation engine.** Track assignment is rule-based and explicit, not learned.
- **Not an adaptive curriculum.** All students cover the same curriculum; they just take different paths through it.
- **Not multi-subject yet.** Math only. Other subjects benefit from the same architecture once the model is proven.
