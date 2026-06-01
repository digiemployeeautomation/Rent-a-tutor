# IELTS Platform — Full Build Roadmap

**Date:** 2026-06-01
**Status:** Active
**Spec reference:** `docs/superpowers/specs/2026-05-20-ielts-pivot-design.md`
**Decision:** Build all code/infrastructure across Waves 1–5. Content bank, AI calibration data, and pricing/payments are gated on owner-provided inputs and are NOT part of this build. Review gate after each wave.

This roadmap is the source of truth for the multi-wave build. Each wave gets its own module spec + plan (under `docs/superpowers/specs/` and `docs/superpowers/plans/`), its own branch, and a review gate before the next wave starts.

---

## Build principle: registry seams enable parallelism

The four IELTS sections (Reading, Listening, Writing, Speaking) must NOT each edit the same shared files (the grade route, the practice index, a section switch). Instead, Wave 1 builds **registry seams** so each section plugs in its grader, renderer, and route subtree without touching shared code. This is what makes Wave 2 safe to build with parallel agents in isolated worktrees.

Seam contracts (defined in Wave 1):
- **Grader registry** — `gradeSubmission(item, submission, deps)` dispatches by `item.type` to a registered grader. A section adds one registry entry; the route does not change.
- **Question-type registry** — maps `practice_questions.question_type` → `{ primitive, label, instruction }`. Reading/Listening render and grade through the three primitives (single-select / multi-select / text-fill).
- **Section descriptor** — each section exposes `{ type, subSkills, route, gradedBy }` from a single module so the practice index and dashboard enumerate sections without hardcoding.

---

## Wave status legend
✅ done · 🔨 in progress · ⬜ not started · 🔒 gated on owner input

---

## Wave 0 — Foundation ✅ (already shipped)
- ✅ Practice-item axis schema (migrations 003–005)
- ✅ Submission + grade core API (Writing path)
- ✅ AI Gateway client + stub grader
- ✅ Writing Task 2 flow end-to-end
- ✅ IELTS onboarding questionnaire + profile persistence
- ✅ IELTS dashboard

## Wave 1 — Engine seams + shared primitives ⬜  *(sequential, built directly — it is the contract)*
- Score→band conversion tables (Academic + General Reading, Listening) as a pure, unit-tested function
- Migration 006: column-level `REVOKE SELECT (answer_key)` on `practice_questions` (answer keys become server-only)
- Grader registry + generalize `POST /api/submissions/:id/grade` to dispatch by `item.type`
- Question-type registry + the three primitive components (single-select / multi-select / text-fill)
- Audio storage helper (Supabase Storage signed-URL upload/read) for Listening + Speaking
- Section descriptor module + practice index driven by it

## Wave 2 — The four sections ⬜  *(parallel agents, isolated worktrees)*
- **Reading** — deterministic grader + passage/questions UI + results + 1–2 seed sets (all 11 question types via the 3 primitives)
- **Listening** — deterministic grader + audio player UI + results + seed set(s)
- **Writing Task 1** — Academic + General, AI-graded, extends existing Writing flow + rubric prompts
- **Speaking** — recording UI + audio upload + Whisper STT + Vercel Workflow + LLM grade + results

## Wave 3 — Content production pipeline ⬜  (🔒 the content *bank* is gated on owner+reviewer)
- Generation service + per-type prompt templates (`lib/content/prompts/`)
- Inline automated quality checks (length/structure/banned-phrase/self-eval/duplicate)
- Admin review queue (`/admin/review`) with edit-and-approve, reject-to-draft
- TTS audio production for Listening (provider via AI Gateway / Azure failover)

## Wave 4 — Personalization & assembly ⬜  *(depends on all sections)*
- Track inference + auto-bump (pure fn, rolling 5-submission average)
- Recommendation engine `recommendNext(...)` (pure fn)
- Placement diagnostic flow (1 item per section, provisional bands)
- "Today's plan" dashboard feed
- Mock-test assembler (pure fn) + timed mock UI + per-item attempt grading

## Wave 5 — Cross-cutting hardening ⬜  (calibration 🔒 on examiner data)
- Cost guardrails: per-tier submission budgets (Writing/Speaking), soft+hard caps, per-user rate limiting
- In-app notifications (grade-ready)
- Calibration job + grading eval set (🔒 needs ~150 examiner-scored samples)

---

## NOT in this build (gated on owner inputs / product decisions)
- The actual content bank (30 Reading / 30 Listening / 40 Writing / 60 Speaking) — pipeline yes, content no
- AI grading calibration data (examiner-scored samples)
- Pricing tiers + payment integration (Stripe vs mobile money)
- IELTS-themed gamification reskin, email/push delivery, live voice-agent interview

---

## Execution model
1. Per wave: write module spec(s) + plan → branch → implement (parallel agents where seams allow) → run tests → summarize → **review gate** → next wave.
2. Pure functions (band conversion, track inference, recommendation, mock assembler, grading equivalence) are built test-first (Vitest).
3. Each section/module is a small, independently testable unit behind a registry seam.
