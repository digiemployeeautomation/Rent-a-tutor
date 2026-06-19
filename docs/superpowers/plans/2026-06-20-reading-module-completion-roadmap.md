# Reading Module — Completion Roadmap

**Date:** 2026-06-20
**Status:** Approved direction (forks locked); per-phase specs/plans to follow.
**Scope:** Take IELTS **Reading** from "engine + 5 modules + demo exam" to exam-ready.

This is a decomposition roadmap, not an implementation plan. Each phase becomes
its own spec → plan → build cycle. Phase 1 is specced immediately after this doc.

---

## 1. Definition of "ready"

Two milestones, sequenced (Tier A is the shippable goal):

- **Tier A — Learner-ready (primary, shippable):** a student can learn *every*
  IELTS Reading question type, drill each with explanations, and sit a
  **realistic, timed, banded** mini-mock. **Academic only.**
- **Tier B — Exam-ready (production):** adds **full-length 40-question /
  3-passage / 60-min mocks**, a real **content bank** (multiple passages per
  type, difficulty levels), **General Training**, progress/mastery tracking, and
  band **calibration**.

**Decision:** drive to Tier A, ship, then iterate toward Tier B. Full-length
mock infrastructure must not block a learner-complete product.

## 2. Locked decisions (this planning round)

| Fork | Decision |
|---|---|
| Primary target | **Tier A first**, then Tier B |
| Content scaling | **Templates now, AI-assisted generation later** (Phase 5) |
| Variant scope | **Academic first**; General Training as a later parallel content effort |
| Module shape | **By strategy family** (group related types), not one-module-per-type |

## 3. Current state (done)

- **Engine:** `skill_lessons` table + server-only `practice_questions.explanation`
  (migration 008); deterministic grader + `gradeReadingSet` pass explanations
  through to results.
- **Registry:** `lib/ielts/question-types.js` maps all 16 types → 3 interaction
  primitives (single-select / multi-select / text-fill). Engines ready for all.
- **Routes:** `/learn/reading` hub (module list + completion + gated exam),
  `/learn/reading/[slug]` lesson viewer, `/practice/reading/[itemId]` runner,
  `/practice/reading/[itemId]/result/[submissionId]` results with explanations.
- **Modules (5):** TFNG, YNNG, sentence completion, MCQ-single, matching-headings
  — each a lesson + single-type drill + per-question explanations.
- **Capstone exam:** mixed 6-question demo, gated until all 5 drills are graded.
- **Tests:** helpers + grading covered; suite green.

## 4. Module map (strategy families)

Coverage is "complete" when every family below has a lesson + at least one
golden drill. Grouping by family gives full type coverage with fewer modules.

| Family | Types | Status |
|---|---|---|
| True/False/Not Given · Yes/No/Not Given | `tfng`, `ynng` | ✅ done |
| Multiple choice | `mcq_single` ✅, `mcq_multi` ⬜ | partial |
| Matching | `matching_headings` ✅, `matching_information` ⬜, `matching_features` ⬜, `matching_sentence_endings` ⬜ | partial |
| Completion | `sentence_completion` ✅, `summary_completion`(+wordlist) ⬜, `note_completion`/`table_completion`/`flowchart_completion`/`diagram_label` ⬜ | partial |
| Short answer | `short_answer` ⬜ | not started |

**Authoring grouping (recommended):** add *MCQ-multi*, *Matching: information /
features / sentence-endings*, *Completion: summary/note*, *Completion:
table/flow-chart/diagram*, *Short answer*. ≈6 new modules cover all remaining
types vs ~11 one-per-type.

## 5. Phased plan

Each phase notes **track** (Engine = code, Content = CAO authoring), deps, and a
"done when". Engine and Content tracks run in parallel once Phase 2 templates land.

### Phase 1 — Realistic exam: timed + banded  *(Engine)*
Add a per-item countdown timer (data-driven from `payload`; proportional
~1.5 min/question, warn-and-lock on expiry) and an IELTS raw→band estimate
(`estimateReadingBand`, Academic/GT tables, scaled for short sets) shown on mock
results. Banding helper + timer are reused by the Phase 6 full mock.
- **Deps:** none. **Done when:** demo exam runs timed, results show an estimated
  band; banding + timer unit-tested; drills unchanged.
- *Spec follows this doc.*

### Phase 2 — Complete question-type coverage (golden drills + templates)  *(Engine → Content)*
Build one canonical end-to-end drill per remaining family/type to (a) prove the
engine renders + grades + explains every type and (b) serve as the authoring
template for the CAO. Standardize passage **paragraph labels (A, B, C…)** in the
payload (matching-headings/information depend on it).
- **Deps:** none (engine ready). **Done when:** every family has ≥1 verified
  golden drill; a documented authoring template exists per family.

### Phase 3 — Cross-cutting strategy lessons  *(Content)*
Lesson-only modules (`question_type = null`): skimming/scanning, locating answers
by keyword, paraphrase recognition, timing/triage. Placed at the front and key
points of the path. Engine provides the slide schema + one example.
- **Deps:** SlideViewer (done). **Done when:** 4–5 strategy lessons published and
  positioned in the path.

### Phase 4 — Progress & mastery  *(Engine)*
Log lesson-viewed (not just "drill graded"); per-type mastery; resume/bookmark;
richer unlock UX; surface progress on the student dashboard.
- **Deps:** Phase 2 (mastery is meaningful only with many types). **Done when:**
  lesson views persist, dashboard shows per-type strength, path resumes state.

### Phase 5 — Content bank + authoring pipeline  *(Engine + Content)*
The real gate to "ready" is volume. Build AI-assisted generation + a human review
queue (`/admin/review`), reusing existing LLM-grader infra, plus per-type
prompt templates and automated quality checks. Grow to multiple passages per
type and difficulty bands.
- **Deps:** Phase 2 templates. **Done when:** content can be generated, reviewed,
  and published without hand-SQL; a usable Academic bank exists.

### Phase 6 — Full-length mock assembly  *(Engine)*  — Tier B
Pure assembler picks 3 passages + ~40 questions in correct type/difficulty
balance; 60-min timed; banded. Long-test UX: question palette, flag-for-review,
split passage/questions pane.
- **Deps:** Phases 1 + 5. **Done when:** a student can take a full 40-Q Academic
  mock end-to-end with a calibrated-ish band.

### Phase 7 — Calibration & QA  *(Engine + Content)*  — Tier B
Difficulty calibration vs examiner-scored samples; grading eval set;
accessibility / performance / mobile polish.
- **Deps:** Phase 6 + sample data (~150 examiner-scored items). **Done when:**
  bands track real performance; a11y/perf audit passes.

## 6. Sequencing & tracks

```
Engine:   P1 ─→ P2 ──────→ P4 ──→ P5 ──→ P6 ──→ P7
                  │                 ▲
Content:          └─ templates ─→ P3 (strategy) ─→ bank authoring ─┘
```

- **Tier A = Phases 1–4** (+ enough Phase 5 content to populate the path).
- **Tier B = Phases 5 (full) – 7.**
- Content authoring (CAO) runs parallel to engine work from Phase 2 onward.

## 7. Explicit deferrals / out of scope (with rationale)

- **Reading-specific grading "depth"** (synonyms, partial credit) — **shelved.**
  IELTS Reading is exact-word, 1 mark/question; the current grader is largely
  correct. Only ongoing task: keep British/American spelling variants in
  accepted-lists.
- **General Training variants** — deferred to a later parallel content effort
  (Academic first).
- **Listening bands / cross-section work** — out of scope for this roadmap.

## 8. Next step

Write the **Phase 1 spec** (timed + banded exam), then its implementation plan,
then build. Subsequent phases get their own spec/plan when reached.
