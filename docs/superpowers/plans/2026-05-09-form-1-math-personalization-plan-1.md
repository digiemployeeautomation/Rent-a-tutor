# Form 1 Math Personalization — Plan 1: Schema + Block-Rendered Lesson (Vertical Slice)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the block-tag-and-select architecture end-to-end. After this plan, opening one seeded Form 1 Math topic shows track-appropriate slides; adding `?track=guided|balanced|exam_ready` to the URL renders a different sequence of slides for the same lesson, all covering the curriculum.

**Architecture:** New `lesson_blocks` table coexists with the legacy `lesson_sections` table (no destructive migration). Block selection is a pure JS function driven by the existing tier names (`guided` / `balanced` / `exam_ready`). The lesson page fetches blocks first; if none exist it falls back to legacy sections so the committed Biology Form 4 lesson keeps working.

**Tech Stack:** Next.js 14 (App Router, JS), Supabase (Postgres + auth-helpers-nextjs), Tailwind. Tests with vitest (added in Task 1).

**What this plan does NOT cover** (later plans):
- Three-stage onboarding (Plan 2)
- Test/exam composer with question bank (Plan 3)
- Performance-driven track auto-bumps (Plan 4)
- Admin authoring UI (Plan 5)

---

## File map

**Create:**
- `vitest.config.js` — vitest configuration
- `lib/blocks/track-rules.js` — track → block-tag-sequence mapping
- `lib/blocks/block-selector.js` — pure function selecting blocks for a track
- `lib/blocks/__tests__/track-rules.test.js`
- `lib/blocks/__tests__/block-selector.test.js`
- `supabase/migrations/002_lesson_blocks.sql` — new lesson_blocks table
- `supabase/seed/seed_form1_math_fractions.sql` — one fully-blocked lesson

**Modify:**
- `package.json` — add `vitest`, `@vitejs/plugin-react`, `jsdom` devDependencies + `test` script
- `app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/lesson/[lessonId]/page.js` — add block fetching + track-aware step building, fall back to legacy sections

---

## Task 1: Set up vitest

**Files:**
- Create: `vitest.config.js`
- Modify: `package.json`

- [ ] **Step 1: Install vitest as a dev dependency**

Run from the repo root:

```bash
npm install --save-dev vitest @vitest/ui
```

Expected: `package.json` gains `vitest` and `@vitest/ui` under `devDependencies`. No production deps change.

- [ ] **Step 2: Add `test` script to package.json**

Edit `package.json`. Add to the `scripts` block:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create `vitest.config.js` at repo root**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/__tests__/**/*.test.js'],
    globals: false,
  },
})
```

- [ ] **Step 4: Verify the runner starts**

Run: `npm test`
Expected: vitest reports "No test files found" (zero tests, exit 0). If the command errors, fix before continuing.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.js
git commit -m "chore: add vitest for pure-function unit tests"
```

---

## Task 2: Track rules — which block tags each track shows

**Files:**
- Create: `lib/blocks/track-rules.js`
- Test: `lib/blocks/__tests__/track-rules.test.js`

The rules encode the table from `docs/superpowers/specs/2026-05-09-form-1-math-personalization-design.md` § 2.

- [ ] **Step 1: Write the failing test**

Create `lib/blocks/__tests__/track-rules.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getTrackRule, BLOCK_TAGS, TRACKS } from '../track-rules.js'

describe('track-rules', () => {
  it('exposes the canonical block-tag list', () => {
    expect(BLOCK_TAGS).toEqual([
      'foundational',
      'core-full',
      'core-summary',
      'worked-easy',
      'worked-medium',
      'worked-hard',
      'practice',
      'common-mistakes',
      'recap',
    ])
  })

  it('exposes the canonical track list (matching tier names)', () => {
    expect(TRACKS).toEqual(['guided', 'balanced', 'exam_ready'])
  })

  it('returns a guided rule whose sequence is the full build-up', () => {
    expect(getTrackRule('guided')).toEqual([
      'foundational',
      'core-full',
      'worked-easy',
      'worked-medium',
      'practice',
      'recap',
    ])
  })

  it('returns a balanced rule with condensed core + medium example + practice + recap', () => {
    expect(getTrackRule('balanced')).toEqual([
      'core-summary',
      'worked-medium',
      'practice',
      'recap',
    ])
  })

  it('returns an exam_ready rule focused on hard examples and common mistakes', () => {
    expect(getTrackRule('exam_ready')).toEqual([
      'core-summary',
      'worked-hard',
      'common-mistakes',
      'practice',
    ])
  })

  it('falls back to the balanced rule for an unknown track name', () => {
    expect(getTrackRule('nonsense')).toEqual(getTrackRule('balanced'))
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `npm test`
Expected: import error or all tests fail because `track-rules.js` does not exist yet.

- [ ] **Step 3: Implement `lib/blocks/track-rules.js`**

```js
// lib/blocks/track-rules.js
//
// Track ↔ block-tag-sequence mapping. Each track represents a different
// pedagogical path through the same curriculum. All tracks must cover the
// same key facts; only the sequence and emphasis differ.
//
// Track names match the existing tier names in lib/tier-config.js:
//   guided     → Learner    (first-time / struggling)
//   balanced   → Reviser    (refresher pass)
//   exam_ready → Exam-prep  (mastery + past-paper style)

export const BLOCK_TAGS = [
  'foundational',
  'core-full',
  'core-summary',
  'worked-easy',
  'worked-medium',
  'worked-hard',
  'practice',
  'common-mistakes',
  'recap',
]

export const TRACKS = ['guided', 'balanced', 'exam_ready']

const RULES = {
  guided: [
    'foundational',
    'core-full',
    'worked-easy',
    'worked-medium',
    'practice',
    'recap',
  ],
  balanced: [
    'core-summary',
    'worked-medium',
    'practice',
    'recap',
  ],
  exam_ready: [
    'core-summary',
    'worked-hard',
    'common-mistakes',
    'practice',
  ],
}

export function getTrackRule(track) {
  return RULES[track] ?? RULES.balanced
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/blocks/track-rules.js lib/blocks/__tests__/track-rules.test.js
git commit -m "feat(blocks): add track-rules mapping tracks to block-tag sequences"
```

---

## Task 3: Block selector — pick blocks from a lesson's pool for a track

**Files:**
- Create: `lib/blocks/block-selector.js`
- Test: `lib/blocks/__tests__/block-selector.test.js`

The selector takes the lesson's full block pool and a track, and returns the ordered subset for that track. Within a tag, blocks are kept in their `order_within_tag` ordering.

- [ ] **Step 1: Write the failing test**

Create `lib/blocks/__tests__/block-selector.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { selectBlocksForTrack } from '../block-selector.js'

const POOL = [
  { id: 'b1', tag: 'foundational',    order_within_tag: 0, slides_data: { s: 'why' } },
  { id: 'b2', tag: 'core-full',       order_within_tag: 0, slides_data: { s: 'rule' } },
  { id: 'b3', tag: 'core-summary',    order_within_tag: 0, slides_data: { s: 'tldr' } },
  { id: 'b4', tag: 'worked-easy',     order_within_tag: 0, slides_data: { s: 'easy' } },
  { id: 'b5', tag: 'worked-medium',   order_within_tag: 0, slides_data: { s: 'med' } },
  { id: 'b6', tag: 'worked-medium',   order_within_tag: 1, slides_data: { s: 'med2' } },
  { id: 'b7', tag: 'worked-hard',     order_within_tag: 0, slides_data: { s: 'hard' } },
  { id: 'b8', tag: 'practice',        order_within_tag: 0, slides_data: { s: 'practice' } },
  { id: 'b9', tag: 'common-mistakes', order_within_tag: 0, slides_data: { s: 'mistakes' } },
  { id: 'b10', tag: 'recap',          order_within_tag: 0, slides_data: { s: 'recap' } },
]

describe('selectBlocksForTrack', () => {
  it('builds the guided sequence: foundational → core-full → worked-easy → worked-medium (in order_within_tag) → practice → recap', () => {
    const result = selectBlocksForTrack(POOL, 'guided')
    expect(result.map(b => b.id)).toEqual(['b1', 'b2', 'b4', 'b5', 'b6', 'b8', 'b10'])
  })

  it('builds the balanced sequence: core-summary → worked-medium → practice → recap', () => {
    const result = selectBlocksForTrack(POOL, 'balanced')
    expect(result.map(b => b.id)).toEqual(['b3', 'b5', 'b6', 'b8', 'b10'])
  })

  it('builds the exam_ready sequence: core-summary → worked-hard → common-mistakes → practice', () => {
    const result = selectBlocksForTrack(POOL, 'exam_ready')
    expect(result.map(b => b.id)).toEqual(['b3', 'b7', 'b9', 'b8'])
  })

  it('skips a tag entirely if the pool has no blocks for it', () => {
    const partialPool = POOL.filter(b => b.tag !== 'worked-medium')
    const result = selectBlocksForTrack(partialPool, 'guided')
    expect(result.map(b => b.id)).toEqual(['b1', 'b2', 'b4', 'b8', 'b10'])
  })

  it('returns an empty array if the pool is empty', () => {
    expect(selectBlocksForTrack([], 'guided')).toEqual([])
  })

  it('orders blocks within a tag by order_within_tag ascending', () => {
    const reversed = [
      { id: 'b6', tag: 'worked-medium', order_within_tag: 1 },
      { id: 'b5', tag: 'worked-medium', order_within_tag: 0 },
      { id: 'b3', tag: 'core-summary',  order_within_tag: 0 },
      { id: 'b8', tag: 'practice',      order_within_tag: 0 },
      { id: 'b10', tag: 'recap',        order_within_tag: 0 },
    ]
    const result = selectBlocksForTrack(reversed, 'balanced')
    expect(result.map(b => b.id)).toEqual(['b3', 'b5', 'b6', 'b8', 'b10'])
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `npm test`
Expected: import error — `block-selector.js` does not exist.

- [ ] **Step 3: Implement `lib/blocks/block-selector.js`**

```js
// lib/blocks/block-selector.js
//
// Pure function: given a lesson's full block pool and a track name,
// return the ordered subset of blocks that track should render.
//
// Within a tag, blocks are kept in their `order_within_tag` ordering.
// A block whose tag is not in the track rule is dropped.

import { getTrackRule } from './track-rules.js'

export function selectBlocksForTrack(blocks, track) {
  if (!Array.isArray(blocks) || blocks.length === 0) return []

  const rule = getTrackRule(track)
  const byTag = new Map()

  for (const block of blocks) {
    if (!byTag.has(block.tag)) byTag.set(block.tag, [])
    byTag.get(block.tag).push(block)
  }

  for (const arr of byTag.values()) {
    arr.sort((a, b) => (a.order_within_tag ?? 0) - (b.order_within_tag ?? 0))
  }

  const out = []
  for (const tag of rule) {
    const blocksForTag = byTag.get(tag)
    if (blocksForTag) out.push(...blocksForTag)
  }
  return out
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test`
Expected: 6 selector tests pass + 6 from Task 2 = 12 total passing.

- [ ] **Step 5: Commit**

```bash
git add lib/blocks/block-selector.js lib/blocks/__tests__/block-selector.test.js
git commit -m "feat(blocks): add pure block selector that filters and orders by track rule"
```

---

## Task 4: Schema migration — `lesson_blocks` table

**Files:**
- Create: `supabase/migrations/002_lesson_blocks.sql`

The table coexists with `lesson_sections`. New lessons populate `lesson_blocks`; legacy lessons (none yet, since the only existing complete lesson is Biology Form 4 which lives in `lesson_sections`) keep working via the fallback in Task 6.

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/002_lesson_blocks.sql`:

```sql
-- ============================================================
-- Migration 002: lesson_blocks
-- Tagged-block pool per lesson. The student's track selects
-- which blocks render, in what order. Coexists with the
-- legacy lesson_sections table; the lesson page falls back
-- to lesson_sections when no blocks exist for a lesson.
-- ============================================================

CREATE TABLE IF NOT EXISTS lesson_blocks (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id          UUID        NOT NULL REFERENCES lessons_new(id) ON DELETE CASCADE,
  tag                TEXT        NOT NULL CHECK (tag IN (
                       'foundational',
                       'core-full',
                       'core-summary',
                       'worked-easy',
                       'worked-medium',
                       'worked-hard',
                       'practice',
                       'common-mistakes',
                       'recap'
                     )),
  order_within_tag   INTEGER     NOT NULL DEFAULT 0,
  slides_data        JSONB       NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_blocks_lesson_id_idx
  ON lesson_blocks (lesson_id);

CREATE INDEX IF NOT EXISTS lesson_blocks_lesson_tag_idx
  ON lesson_blocks (lesson_id, tag, order_within_tag);

-- RLS: students can read; only admins can write.
ALTER TABLE lesson_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_blocks_read_authenticated"
  ON lesson_blocks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lesson_blocks_write_admin_only"
  ON lesson_blocks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
```

- [ ] **Step 2: Apply the migration to the Supabase project**

Two ways, pick one:

**Via Supabase MCP** (preferred — copy the file's SQL into `apply_migration` with name `lesson_blocks`).

**Via Supabase CLI / dashboard** if the MCP tool is not available, paste the SQL into the SQL editor in the Supabase dashboard and run it.

Verify after applying:

```sql
-- Run in the Supabase SQL editor
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lesson_blocks'
ORDER BY ordinal_position;
```

Expected columns: `id`, `lesson_id`, `tag`, `order_within_tag`, `slides_data`, `created_at`.

```sql
SELECT polname FROM pg_policies WHERE tablename = 'lesson_blocks';
```

Expected: 2 policies (`lesson_blocks_read_authenticated`, `lesson_blocks_write_admin_only`).

- [ ] **Step 3: Commit the migration file**

```bash
git add supabase/migrations/002_lesson_blocks.sql
git commit -m "feat(db): add lesson_blocks table with track-tag pool"
```

---

## Task 5: Seed one Form 1 Math topic with full block coverage

**Files:**
- Create: `supabase/seed/seed_form1_math_fractions.sql`

Seeds: a Form 1 → Term 1 → (Maths unit) → "Fractions" topic → "Introduction to Fractions" lesson → 9 blocks covering all tags. Idempotent (re-runnable).

- [ ] **Step 1: Create the seed file**

Create `supabase/seed/seed_form1_math_fractions.sql`:

```sql
-- ============================================================
-- Seed: Form 1 Mathematics — Fractions (one fully-blocked lesson)
-- Idempotent: safe to run multiple times.
-- ============================================================

-- Resolve the Form 1 → Term 1 → Mathematics → Fractions hierarchy.
-- Forms, terms, and subjects are seeded by seed_curriculum.sql; ensure
-- it ran first.

DO $$
DECLARE
  v_form_id    UUID;
  v_term_id    UUID;
  v_subject_id UUID;
  v_unit_id    UUID;
  v_topic_id   UUID;
  v_lesson_id  UUID;
BEGIN
  SELECT id INTO v_form_id    FROM forms        WHERE level = 1;
  SELECT id INTO v_term_id    FROM terms        WHERE form_id = v_form_id AND number = 1;
  SELECT id INTO v_subject_id FROM subjects_new WHERE slug = 'mathematics';

  IF v_form_id IS NULL OR v_term_id IS NULL OR v_subject_id IS NULL THEN
    RAISE EXCEPTION 'seed_curriculum.sql must run first (form/term/subject not found)';
  END IF;

  -- Unit: "Numbers" (number 1 in Term 1 Math)
  INSERT INTO units (term_id, subject_id, number, title, description)
  VALUES (v_term_id, v_subject_id, 1, 'Numbers',
          'Whole numbers, fractions, decimals, and basic operations.')
  ON CONFLICT (term_id, subject_id, number) DO NOTHING;
  SELECT id INTO v_unit_id FROM units
    WHERE term_id = v_term_id AND subject_id = v_subject_id AND number = 1;

  -- Topic: "Fractions"
  INSERT INTO topics (unit_id, title, description, "order")
  VALUES (v_unit_id, 'Fractions',
          'What fractions mean, equivalent fractions, and basic operations.', 1)
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_topic_id FROM topics
    WHERE unit_id = v_unit_id AND title = 'Fractions';

  -- Lesson: "Introduction to Fractions"
  INSERT INTO lessons_new (topic_id, title, description, "order", status)
  VALUES (v_topic_id, 'Introduction to Fractions',
          'What a fraction is, the parts of a fraction, and reading fractions.',
          1, 'published')
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_lesson_id FROM lessons_new
    WHERE topic_id = v_topic_id AND title = 'Introduction to Fractions';

  -- Wipe and reseed blocks for this lesson (idempotent rebuild)
  DELETE FROM lesson_blocks WHERE lesson_id = v_lesson_id;

  -- slides_data is a JSONB array; each element is a slide object with
  -- { title, content, bullets?, image? } as expected by components/lesson/SlideViewer.js.
  -- All 9 tag types, with one block each (worked-medium gets two to test ordering).
  INSERT INTO lesson_blocks (lesson_id, tag, order_within_tag, slides_data) VALUES
    (v_lesson_id, 'foundational', 0,
      '[{"title":"Why fractions matter","content":"You meet fractions every day — sharing food, splitting time, measuring ingredients. This lesson teaches what they mean."}]'::jsonb),

    (v_lesson_id, 'core-full', 0,
      '[
        {"title":"What is a fraction?","content":"A fraction shows a part of a whole. It is written as a number on top of a number, with a line between."},
        {"title":"Numerator and denominator","content":"The top number (numerator) shows how many parts you have. The bottom number (denominator) shows how many equal parts the whole is divided into.","bullets":["Numerator = parts you have","Denominator = total equal parts"]},
        {"title":"Reading fractions","content":"Practice reading these:","bullets":["1/2 is read \"one half\"","1/4 is \"one quarter\"","3/4 is \"three quarters\""]}
      ]'::jsonb),

    (v_lesson_id, 'core-summary', 0,
      '[{"title":"Fractions — at a glance","content":"A fraction is part of a whole, written as numerator/denominator. Top = parts you have. Bottom = total equal parts."}]'::jsonb),

    (v_lesson_id, 'worked-easy', 0,
      '[{"title":"Worked example (easy)","content":"A pizza is cut into 4 equal slices. You eat 1 slice. What fraction did you eat? Answer: 1/4. The whole is split into 4 equal parts. You took 1."}]'::jsonb),

    (v_lesson_id, 'worked-medium', 0,
      '[{"title":"Worked example (medium, part 1)","content":"A class of 30 has 12 girls. What fraction of the class are girls? Answer: 12/30, which simplifies to 2/5."}]'::jsonb),

    (v_lesson_id, 'worked-medium', 1,
      '[{"title":"Worked example (medium, part 2)","content":"You read 3/8 of a 64-page book. How many pages have you read? Compute: 3/8 of 64 = (3 × 64) / 8 = 24 pages."}]'::jsonb),

    (v_lesson_id, 'worked-hard', 0,
      '[{"title":"Worked example (hard)","content":"A farmer harvests maize from 5/12 of a 36-hectare field on Monday and 1/4 of the field on Tuesday. How many hectares are harvested in total?","bullets":["Monday: (5/12) × 36 = 15 ha","Tuesday: (1/4) × 36 = 9 ha","Total: 24 ha"]}]'::jsonb),

    (v_lesson_id, 'practice', 0,
      '[{"title":"Try these","content":"Work through these on your own:","bullets":["A chocolate bar has 10 squares. You eat 3. What fraction did you eat?","Read 5/8 aloud.","Write \"three fifths\" as a fraction."]}]'::jsonb),

    (v_lesson_id, 'common-mistakes', 0,
      '[{"title":"Common mistakes","content":"Don''t flip the numerator and denominator. 3/4 (three-quarters) is NOT the same as 4/3. Always check which number is the total (denominator) and which is the part (numerator)."}]'::jsonb),

    (v_lesson_id, 'recap', 0,
      '[{"title":"Recap","content":"A fraction is a part of a whole. Numerator on top, denominator on bottom. The denominator tells you how many equal parts the whole is split into."}]'::jsonb);
END $$;
```

- [ ] **Step 2: Apply the seed**

Run the SQL via the Supabase MCP `execute_sql` tool, or paste into the SQL editor.

Verify:

```sql
SELECT tag, order_within_tag, slides_data->0->>'title' AS first_slide_title
FROM lesson_blocks lb
JOIN lessons_new l ON l.id = lb.lesson_id
WHERE l.title = 'Introduction to Fractions'
ORDER BY tag, order_within_tag;
```

Expected: 10 rows, all 9 tags present (worked-medium has 2 rows).

- [ ] **Step 3: Commit the seed file**

```bash
git add supabase/seed/seed_form1_math_fractions.sql
git commit -m "feat(seed): seed Form 1 Math 'Introduction to Fractions' with full block coverage"
```

---

## Task 6: Lesson page — fetch blocks, select for track, render

**Files:**
- Modify: `app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/lesson/[lessonId]/page.js`

Add block-aware step building. If the lesson has blocks, use them; otherwise fall back to the legacy `lesson_sections` path. Track resolution for V1 = `?track=` query param > `student_profiles.learning_tier` (already loaded) > `'balanced'`.

- [ ] **Step 1: Add `useSearchParams` import and read the override**

In the modified file, change the import line from:

```js
import { useParams, useRouter } from 'next/navigation'
```

to:

```js
import { useParams, useRouter, useSearchParams } from 'next/navigation'
```

Inside the `LessonPage` component, immediately after `const router = useRouter()`, add:

```js
const searchParams = useSearchParams()
const trackOverride = searchParams.get('track')
```

- [ ] **Step 2: Add a `selectBlocksForTrack` import**

At the top with the other lib imports, add:

```js
import { selectBlocksForTrack } from '@/lib/blocks/block-selector'
```

- [ ] **Step 3: Replace `buildSteps` with a block-aware variant**

Replace the existing `buildSteps` function (lines around 26–48 in the original) with:

```js
function buildStepsFromSections(sections, quizzes) {
  // Legacy path: merge lesson_sections (video|slides) with quizzes by `order`.
  const sectionSteps = (sections ?? []).map(s => ({
    kind: 'section',
    id: s.id,
    type: s.type,
    order: s.order ?? 0,
    data: s,
    label: s.type === 'video' ? 'Video' : 'Slides',
  }))

  const quizSteps = (quizzes ?? []).map(q => ({
    kind: 'quiz',
    id: q.id,
    type: 'quiz',
    order: q.order ?? 0,
    data: q,
    label: 'Quiz',
  }))

  return [...sectionSteps, ...quizSteps].sort((a, b) => a.order - b.order)
}

function buildStepsFromBlocks(orderedBlocks, quizzes) {
  // Block path: each selected block becomes a 'slides' step. Quizzes are
  // appended after all block steps. Plan 3 will integrate quizzes into the
  // block sequence; for Plan 1 we keep them as a trailing block.
  const blockSteps = orderedBlocks.map((block, idx) => ({
    kind: 'section',
    id: block.id,
    type: 'slides',
    order: idx,
    data: block,                  // exposes block.slides_data to the existing renderer
    label: blockTagLabel(block.tag),
  }))

  const quizSteps = (quizzes ?? []).map((q, i) => ({
    kind: 'quiz',
    id: q.id,
    type: 'quiz',
    order: blockSteps.length + i,
    data: q,
    label: 'Quiz',
  }))

  return [...blockSteps, ...quizSteps]
}

function blockTagLabel(tag) {
  switch (tag) {
    case 'foundational':    return 'Why this matters'
    case 'core-full':       return 'Core idea'
    case 'core-summary':    return 'Key points'
    case 'worked-easy':     return 'Worked example'
    case 'worked-medium':   return 'Worked example'
    case 'worked-hard':     return 'Challenge example'
    case 'practice':        return 'Practice'
    case 'common-mistakes': return 'Common mistakes'
    case 'recap':           return 'Recap'
    default:                return 'Slides'
  }
}
```

- [ ] **Step 4: Fetch blocks alongside sections in the load effect**

In the `load()` async function (around line 126 in the original), insert this fetch *between* the existing section fetch and quiz fetch:

```js
      // 3b. Lesson blocks (new path — Plan 1 of personalization)
      const { data: blocksData } = await supabase
        .from('lesson_blocks')
        .select('id, lesson_id, tag, order_within_tag, slides_data')
        .eq('lesson_id', lessonId)
        .order('tag', { ascending: true })
        .order('order_within_tag', { ascending: true })
```

- [ ] **Step 5: Decide which step builder to use based on track and block availability**

Replace the existing `// 6. Build steps` block:

```js
      // 6. Build steps — prefer blocks if present, fall back to legacy sections.
      const resolvedTrack = trackOverride || profileData?.learning_tier || 'balanced'

      let builtSteps
      if (blocksData && blocksData.length > 0) {
        const ordered = selectBlocksForTrack(blocksData, resolvedTrack)
        builtSteps = buildStepsFromBlocks(ordered, quizzesData)
      } else {
        builtSteps = buildStepsFromSections(sectionsData, quizzesData)
      }
      setSteps(builtSteps)
```

Note: the existing `load()` function fetches `profileData` later (in its step 9 — the `// 9. Learning tier` block). Move that lookup *up* so it runs right after auth, because step 6 of `load()` (build steps) now needs the resolved tier. Insert this new block immediately after the existing `// 1. Auth` block, labeled `1b`:

```js
      // 1b. Load student profile early — needed for track resolution.
      let profileData = null
      if (sid) {
        const { data } = await supabase
          .from('student_profiles')
          .select('learning_tier')
          .eq('user_id', sid)
          .single()
        profileData = data
      }
```

Then in step 9, replace the existing profile fetch + `setLearningTier` call with:

```js
      // 9. Apply learning tier to state (already loaded for track resolution)
      setLearningTier(profileData?.learning_tier ?? 'balanced')
```

- [ ] **Step 6: Run `npm run dev` and test manually**

Start the dev server: `npm run dev`

In a browser, navigate to the seeded lesson URL. The URL pattern is:

```
http://localhost:3000/learn/<form1Id>/<term1Id>/mathematics/<topicId>/lesson/<lessonId>
```

To get the IDs, run in the Supabase SQL editor:

```sql
SELECT
  f.id AS form_id, t.id AS term_id, top.id AS topic_id, l.id AS lesson_id
FROM forms f
JOIN terms t ON t.form_id = f.id
JOIN units u ON u.term_id = t.id
JOIN subjects_new s ON s.id = u.subject_id
JOIN topics top ON top.unit_id = u.id
JOIN lessons_new l ON l.topic_id = top.id
WHERE f.level = 1 AND t.number = 1 AND s.slug = 'mathematics'
  AND top.title = 'Fractions' AND l.title = 'Introduction to Fractions';
```

Use those IDs to build the URL.

Verify:
- Default load (no `?track=`): shows 6 step labels (`Why this matters`, `Core idea`, `Worked example`, `Worked example`, `Practice`, `Recap`) — matching the `guided` rule **only if** the user's profile has `learning_tier = 'guided'`. If the profile defaults to `balanced`, you should see 4 labels (`Key points`, `Worked example`, `Practice`, `Recap`).
- `?track=guided` → 6 steps starting with `Why this matters`.
- `?track=balanced` → 4 steps starting with `Key points`.
- `?track=exam_ready` → 4 steps: `Key points`, `Challenge example`, `Common mistakes`, `Practice`.

If any of these don't match, debug before continuing.

- [ ] **Step 7: Commit the lesson page changes**

```bash
git add app/learn/\[formId\]/\[termId\]/\[subjectSlug\]/\[topicId\]/lesson/\[lessonId\]/page.js
git commit -m "feat(lesson): render track-selected blocks; fall back to legacy sections"
```

---

## Task 7: End-to-end manual verification of the vertical slice

This is a checklist, not code. Run through it in order with the dev server running.

- [ ] **Step 1: Confirm the legacy lesson still works**

Navigate to the existing Biology Form 4 — Nervous System lesson (URL discoverable via the same SQL pattern as above with `f.level = 4 AND s.slug = 'biology'`).

Expected: page loads as before, no errors. The fallback from blocks → `lesson_sections` is working.

- [ ] **Step 2: Confirm the new lesson works in default mode**

Open the seeded `Introduction to Fractions` lesson with no query params.

Expected: a sequence of slide steps matching the user's profile-stored tier. No errors in the console.

- [ ] **Step 3: Switch tracks via query param**

In the same browser, append `?track=guided` to the URL. Reload.

Expected: 6 step labels in the order: `Why this matters`, `Core idea`, `Worked example`, `Worked example`, `Practice`, `Recap`.

Append `?track=exam_ready`. Reload.

Expected: 4 step labels: `Key points`, `Challenge example`, `Common mistakes`, `Practice`.

- [ ] **Step 4: Confirm curriculum coverage across tracks**

Walk through the full slide sequence in each track and write down which "core fact" you saw in each. Confirm none is missing across the three tracks. (If something is genuinely curriculum-critical and only appears in `guided`, that's a content bug — fix the seed.)

- [ ] **Step 5: Run the unit test suite once more**

Run: `npm test`
Expected: 12 tests pass (6 + 6).

- [ ] **Step 6: Commit any seed/test fixes from steps 4–5 if needed**

If no fixes needed, skip. Otherwise:

```bash
git add <files>
git commit -m "fix: <what you fixed>"
```

---

## Plan summary

When this plan is complete you will have:

- A vitest harness with 12 unit tests covering the pure block-selection logic.
- A `lesson_blocks` table coexisting with `lesson_sections`, with admin-write / authenticated-read RLS.
- One Form 1 Math lesson seeded with all 9 block tags (10 blocks total).
- A lesson page that renders track-aware block sequences and falls back to legacy sections when no blocks exist.
- A working `?track=` override for testing without onboarding wired in.

The architecture is now proven end-to-end. Plan 2 (onboarding) replaces the `?track=` override with real per-topic track resolution.

---

## What the next plan will do (preview)

**Plan 2 — Three-stage onboarding:**
- Stage 1 question library + signup-time UI (10 global questions).
- Stage 2 per-subject intake UI (gate before first lesson access).
- Stage 3 per-topic micro-intake UI (gate before first topic open).
- Profile schema additions for stages 1/2/3 answers + resolved tiers per subject and topic.
- Replace the `?track=` override path with: `topic_tier > subject_tier > default_tier > balanced`.
