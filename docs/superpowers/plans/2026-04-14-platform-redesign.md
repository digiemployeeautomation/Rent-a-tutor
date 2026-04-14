# Platform Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Rent a Tutor from a tutor marketplace into a subscription-based, self-serve learning platform with structured lessons, quizzes, personalized learning tiers, and gamification.

**Architecture:** Evolve the existing Next.js 14 + Supabase codebase. Replace the old single-video lesson model with a curriculum-aligned hierarchy (Form → Term → Subject → Unit → Topic → Lesson). Replace per-lesson purchases with subscription plans. Add gamification (XP, streaks, leaderboards, badges). Keep existing auth, payment integration, and middleware patterns.

**Tech Stack:** Next.js 14 (App Router), Supabase (PostgreSQL, Auth, Storage), Tailwind CSS, MoneyUnify API (mobile money), Cloudflare Stream (video)

**Spec:** `docs/superpowers/specs/2026-04-14-lesson-platform-redesign-design.md`

---

## Plan Overview (7 phases)

| Phase | Name | Depends On |
|-------|------|------------|
| 1 | Database Schema & Seed Data | — |
| 2 | Auth, Onboarding & Personalization | Phase 1 |
| 3 | Subscription & Payment System | Phase 1, 2 |
| 4 | Content Browsing & Lesson Player | Phase 1, 3 |
| 5 | Student Dashboard & Gamification | Phase 1, 2, 4 |
| 6 | Admin Panel | Phase 1 |
| 7 | Cleanup & Middleware Update | Phase 1-6 |

---

## File Structure

### New files to create

```
lib/
  supabaseServer.js              — Server-side Supabase client (route handlers)
  subscription.js                — Subscription access checking logic
  xp.js                          — XP award + level calculation
  quiz-grading.js                — Quiz grading logic (MC, T/F, short answer)
  tier-config.js                 — Tier definitions (Guided/Balanced/Exam Ready)
  personality.js                 — Personality question pool + tier recommendation

app/
  onboarding/
    page.js                      — Personality test / welcome screen
    layout.js                    — Onboarding layout (minimal nav)

  learn/
    page.js                      — Form selection (Form 1-4)
    [formId]/
      page.js                    — Term selection (Term 1-3)
      [termId]/
        page.js                  — Subject grid for that form/term
        [subjectSlug]/
          page.js                — Units + topics view
          [topicId]/
            page.js              — Lessons list for a topic
            lesson/
              [lessonId]/
                page.js          — Lesson player (video/slides/quiz flow)

  dashboard/
    student/
      page.js                    — Redesigned student dashboard (hybrid)
      layout.js                  — Keep, modify
      settings/
        page.js                  — Settings with personalization section
      leaderboard/
        page.js                  — Leaderboard page

  admin/
    page.js                      — Admin dashboard (analytics overview)
    layout.js                    — Admin layout with sidebar nav
    subjects/
      page.js                    — Manage subjects
    content/
      page.js                    — Content management (units/topics/lessons)
      [lessonId]/
        page.js                  — Edit lesson sections + quizzes
    students/
      page.js                    — Student management
    subscriptions/
      page.js                    — Subscription management

  api/
    subscription/
      request/route.js           — Initiate subscription payment
      verify/route.js            — Verify subscription payment
    quiz/
      submit/route.js            — Submit quiz answers, return grading
      reflection/route.js        — Submit reflection (Quiz 4), return feedback
    progress/
      route.js                   — Record lesson section completion
    admin/
      content/route.js           — CRUD for content (subjects, units, topics, lessons)
      quiz-questions/route.js    — CRUD for quiz questions
      students/route.js          — Student management endpoints

components/
  layout/
    Navbar.js                    — Modify for new navigation
    DashboardShell.js            — Modify for student-only shell
    AdminShell.js                — Admin sidebar navigation
  lesson/
    VideoPlayer.js               — Video player component (Cloudflare/YouTube)
    SlideViewer.js               — Slide rendering from JSON
    QuizPlayer.js                — Quiz UI (MC, T/F, short answer, reflection)
    LessonProgress.js            — Progress bar within a lesson
    Paywall.js                   — Subscription prompt overlay
  dashboard/
    ProgressRings.js             — Subject progress ring components
    StreakCounter.js              — Streak display
    XPBar.js                     — XP and level progress bar
    ActivityFeed.js              — Recent activity list
    LeaderboardPreview.js        — Mini leaderboard widget
  onboarding/
    PersonalityQuiz.js           — Question UI for personality test
    TierRecommendation.js        — Tier selection/confirmation
  admin/
    ContentEditor.js             — Lesson section editor
    QuizEditor.js                — Quiz question editor
    AnalyticsCards.js             — Analytics dashboard cards
```

### Files to modify

```
middleware.js                    — Remove tutor routes, add /onboarding, /learn, /admin protection
app/layout.js                   — Update nav context for new routes
app/auth/register/page.js       — Simplify (student-only registration)
app/auth/login/page.js          — Update redirect targets
context/ThemeContext.js          — Simplify (single student theme)
lib/csrf.js                     — Keep as-is
lib/supabase.js                 — Keep as-is
```

### Files to delete (Phase 7)

```
app/tutor/                       — Entire directory
app/dashboard/tutor/             — Entire directory
app/browse/                      — Entire directory (replaced by /learn)
app/api/topic-requests/          — Entire directory
app/dashboard/student/purchases/ — Replaced by new dashboard
app/dashboard/student/topic-requests/ — No longer needed
components/TopicRequestFeed.js
components/TopicRequestForm.js
```

---

## Phase 1: Database Schema & Seed Data

### Task 1.1: Create server-side Supabase client utility

**Files:**
- Create: `lib/supabaseServer.js`

- [ ] **Step 1: Create the server-side client**

```js
// lib/supabaseServer.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function createServerClient() {
  return createRouteHandlerClient({ cookies })
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabaseServer.js
git commit -m "feat: add server-side Supabase client utility"
```

### Task 1.2: Create new database tables via Supabase SQL

**Files:**
- Create: `supabase/migrations/001_platform_redesign.sql`

- [ ] **Step 1: Create migration directory**

```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Write the migration SQL**

```sql
-- supabase/migrations/001_platform_redesign.sql

-- ============================================
-- SUBJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS subjects_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FORMS
-- ============================================
CREATE TABLE IF NOT EXISTS forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE CHECK (level BETWEEN 1 AND 4),
  name TEXT NOT NULL
);

-- ============================================
-- TERMS
-- ============================================
CREATE TABLE IF NOT EXISTS terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 3),
  name TEXT NOT NULL,
  UNIQUE (form_id, number)
);

-- ============================================
-- UNITS
-- ============================================
CREATE TABLE IF NOT EXISTS units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects_new(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  UNIQUE (term_id, subject_id, number)
);

-- ============================================
-- TOPICS
-- ============================================
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS lessons_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'coming_soon' CHECK (status IN ('draft', 'published', 'coming_soon')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LESSON SECTIONS (video/slides within a lesson)
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons_new(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'slides')),
  "order" INTEGER NOT NULL,
  content_url TEXT,
  cloudflare_video_id TEXT,
  slides_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- QUIZZES
-- ============================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons_new(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects_new(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN (
    'lesson_mc', 'lesson_mc_tf', 'lesson_short', 'lesson_reflection',
    'topic_test', 'term_exam'
  )),
  "order" INTEGER NOT NULL DEFAULT 0,
  tier_config JSONB NOT NULL DEFAULT '{
    "guided": {"pass_mark": 0, "time_limit_minutes": null, "max_retries": null, "show_explanations": "immediate"},
    "balanced": {"pass_mark": 60, "time_limit_minutes": null, "max_retries": 3, "show_explanations": "after_submit"},
    "exam_ready": {"pass_mark": 80, "time_limit_minutes": null, "max_retries": null, "show_explanations": "after_pass"}
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- QUIZ QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'free_form')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('subject', 'term', 'form')),
  subject_id UUID REFERENCES subjects_new(id),
  form_id UUID REFERENCES forms(id),
  term_id UUID REFERENCES terms(id),
  billing_type TEXT NOT NULL CHECK (billing_type IN ('monthly', 'one_time')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  price_paid INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STUDENT PROFILES (extended)
-- ============================================
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  learning_tier TEXT NOT NULL DEFAULT 'balanced' CHECK (learning_tier IN ('guided', 'balanced', 'exam_ready')),
  personality_answers JSONB DEFAULT '[]'::jsonb,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  xp_total INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  interested_subjects UUID[] DEFAULT '{}',
  form_level INTEGER CHECK (form_level BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STUDENT PROGRESS
-- ============================================
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons_new(id) ON DELETE CASCADE,
  section_id UUID REFERENCES lesson_sections(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, lesson_id, section_id)
);

-- ============================================
-- QUIZ ATTEMPTS
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('guided', 'balanced', 'exam_ready')),
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  attempt_number INTEGER NOT NULL DEFAULT 1
);

-- ============================================
-- ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT,
  criteria_type TEXT NOT NULL,
  criteria_value JSONB NOT NULL
);

-- ============================================
-- STUDENT ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS student_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, achievement_id)
);

-- ============================================
-- STREAKS
-- ============================================
CREATE TABLE IF NOT EXISTS streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE (student_id, date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_units_term_subject ON units(term_id, subject_id);
CREATE INDEX idx_topics_unit ON topics(unit_id);
CREATE INDEX idx_lessons_topic ON lessons_new(topic_id);
CREATE INDEX idx_lesson_sections_lesson ON lesson_sections(lesson_id);
CREATE INDEX idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX idx_quizzes_topic ON quizzes(topic_id);
CREATE INDEX idx_quizzes_term ON quizzes(term_id);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_subscriptions_student ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(student_id, status) WHERE status = 'active';
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_streaks_student_date ON streaks(student_id, date);
CREATE INDEX idx_student_achievements_student ON student_achievements(student_id);

-- ============================================
-- RPC: Increment XP safely
-- ============================================
CREATE OR REPLACE FUNCTION increment_xp(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE student_profiles
  SET xp_total = xp_total + p_amount
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: Record or increment daily streak
-- ============================================
CREATE OR REPLACE FUNCTION record_activity(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO streaks (student_id, date, activity_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (student_id, date)
  DO UPDATE SET activity_count = streaks.activity_count + 1;
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 3: Run the migration in Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run the migration SQL. Alternatively, if using Supabase CLI:

```bash
# If Supabase CLI is set up:
supabase db push
```

- [ ] **Step 4: Commit the migration file**

```bash
git add supabase/migrations/001_platform_redesign.sql
git commit -m "feat: add database schema for platform redesign"
```

### Task 1.3: Seed curriculum data (subjects, forms, terms)

**Files:**
- Create: `supabase/seed/seed_curriculum.sql`

- [ ] **Step 1: Write the seed SQL**

```sql
-- supabase/seed/seed_curriculum.sql

-- Forms
INSERT INTO forms (level, name) VALUES
  (1, 'Form 1'),
  (2, 'Form 2'),
  (3, 'Form 3'),
  (4, 'Form 4')
ON CONFLICT (level) DO NOTHING;

-- Terms (3 per form)
INSERT INTO terms (form_id, number, name)
SELECT f.id, t.number, 'Term ' || t.number
FROM forms f
CROSS JOIN (VALUES (1), (2), (3)) AS t(number)
ON CONFLICT (form_id, number) DO NOTHING;

-- Subjects
INSERT INTO subjects_new (name, slug, description) VALUES
  ('Agricultural Science', 'agricultural-science', 'Agriculture in Zambia, soil science, crop and livestock production'),
  ('Biology', 'biology', 'Cellular life, organisms, evolution, and ecological relationships'),
  ('Chemistry', 'chemistry', 'Matter, chemical reactions, organic and inorganic chemistry'),
  ('Civic Education', 'civic-education', 'Governance, human rights, democracy, and civic responsibility'),
  ('English Language', 'english-language', 'Reading, writing, grammar, and communication skills'),
  ('Food and Nutrition', 'food-and-nutrition', 'Nutrition science, food preparation, and dietary health'),
  ('Geography', 'geography', 'Physical and human geography, map skills, and environmental studies'),
  ('History', 'history', 'Zambian and world history, political developments, and cultural heritage'),
  ('Mathematics', 'mathematics', 'Algebra, geometry, statistics, and mathematical reasoning'),
  ('Physical Education and Sport', 'physical-education', 'Physical fitness, sports skills, and health education'),
  ('Religious Education', 'religious-education', 'World religions, ethics, morality, and spiritual development')
ON CONFLICT (name) DO NOTHING;
```

- [ ] **Step 2: Run the seed in Supabase SQL Editor**

Paste into Supabase Dashboard → SQL Editor and run.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/seed_curriculum.sql
git commit -m "feat: seed curriculum data (11 subjects, 4 forms, 12 terms)"
```

### Task 1.4: Seed default achievements

**Files:**
- Create: `supabase/seed/seed_achievements.sql`

- [ ] **Step 1: Write achievements seed**

```sql
-- supabase/seed/seed_achievements.sql

INSERT INTO achievements (name, description, icon, criteria_type, criteria_value) VALUES
  ('Getting Started', 'Completed your first lesson', '🎯', 'lessons_completed', '{"count": 1}'),
  ('Flawless', 'Scored 100% on any quiz', '💎', 'perfect_quiz', '{"count": 1}'),
  ('Week Warrior', '7-day learning streak', '🔥', 'streak', '{"days": 7}'),
  ('Month Master', '30-day learning streak', '⚡', 'streak', '{"days": 30}'),
  ('Century Streak', '100-day learning streak', '🏆', 'streak', '{"days": 100}'),
  ('Topic Champion', 'Completed all lessons in a topic', '🏅', 'topic_complete', '{"count": 1}'),
  ('Term Finisher', 'Completed all topics in a term', '🎓', 'term_complete', '{"count": 1}'),
  ('Quick Learner', 'Passed a quiz on the first attempt', '⭐', 'first_attempt_pass', '{"count": 1}'),
  ('Knowledge Seeker', 'Completed 10 lessons', '📚', 'lessons_completed', '{"count": 10}'),
  ('Scholar', 'Completed 50 lessons', '🎓', 'lessons_completed', '{"count": 50}')
ON CONFLICT (name) DO NOTHING;
```

- [ ] **Step 2: Run in Supabase SQL Editor**

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/seed_achievements.sql
git commit -m "feat: seed default achievements"
```

### Task 1.5: Create tier configuration module

**Files:**
- Create: `lib/tier-config.js`

- [ ] **Step 1: Write tier configuration**

```js
// lib/tier-config.js

export const TIERS = {
  guided: {
    name: 'Guided',
    description: 'Relaxed pace — learn at your own speed',
    lesson_quiz: {
      pass_mark: 0,          // Can proceed regardless
      show_explanations: 'immediate',
      max_retries: null,     // Unlimited
    },
    topic_test: {
      questions: 20,
      time_limit_minutes: null,
      pass_mark: 50,
      max_retries: null,
    },
    term_exam: {
      questions: 40,
      time_limit_minutes: null,
      pass_mark: 50,
      max_retries: null,
      format: 'by_topic',
    },
  },
  balanced: {
    name: 'Balanced',
    description: 'Recommended — pushes you without blocking you',
    lesson_quiz: {
      pass_mark: 60,
      show_explanations: 'after_submit',
      max_retries: 3,
    },
    topic_test: {
      questions: 30,
      time_limit_minutes: 45,
      pass_mark: 60,
      max_retries: 3,
    },
    term_exam: {
      questions: 60,
      time_limit_minutes: 90,
      pass_mark: 60,
      max_retries: 2,
      format: 'exam_sections',
    },
  },
  exam_ready: {
    name: 'Exam Ready',
    description: 'Strict — real exam pressure to prepare you',
    lesson_quiz: {
      pass_mark: 80,
      show_explanations: 'after_pass',
      max_retries: null,     // Unlimited but full reset
    },
    topic_test: {
      questions: 40,
      time_limit_minutes: 30,
      pass_mark: 75,
      max_retries: null,
    },
    term_exam: {
      questions: 80,
      time_limit_minutes: 60,
      pass_mark: 75,
      max_retries: null,
      format: 'ecz_exam',
    },
  },
}

export const DEFAULT_TIER = 'balanced'

export function getTierConfig(tierName) {
  return TIERS[tierName] || TIERS[DEFAULT_TIER]
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/tier-config.js
git commit -m "feat: add tier configuration module"
```

### Task 1.6: Create XP configuration module

**Files:**
- Create: `lib/xp.js`

- [ ] **Step 1: Write XP module**

```js
// lib/xp.js

export const XP_REWARDS = {
  complete_section: 10,
  pass_lesson_quiz: 25,
  pass_topic_test: 100,
  pass_term_exam: 500,
  first_attempt_bonus: 10,
  perfect_score_bonus: 25,
  streak_milestone_bonus: 50,
}

// Level thresholds — level N requires LEVELS[N] total XP
export const LEVELS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2100,   // Level 7
  2800,   // Level 8
  3600,   // Level 9
  4500,   // Level 10
  5500,   // Level 11
  6600,   // Level 12
  7800,   // Level 13
  9100,   // Level 14
  10500,  // Level 15
]

export function getLevelForXP(xp) {
  let level = 1
  for (let i = 1; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i]) {
      level = i + 1
    } else {
      break
    }
  }
  return level
}

export function getXPForNextLevel(xp) {
  const currentLevel = getLevelForXP(xp)
  if (currentLevel >= LEVELS.length) return null // Max level
  return LEVELS[currentLevel] - xp
}

export function calculateXPAward(action, { isFirstAttempt = false, isPerfectScore = false } = {}) {
  let xp = XP_REWARDS[action] || 0
  if (isFirstAttempt) xp += XP_REWARDS.first_attempt_bonus
  if (isPerfectScore) xp += XP_REWARDS.perfect_score_bonus
  return xp
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/xp.js
git commit -m "feat: add XP rewards and level calculation module"
```

### Task 1.7: Create subscription access checking module

**Files:**
- Create: `lib/subscription.js`

- [ ] **Step 1: Write subscription checker**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/subscription.js
git commit -m "feat: add subscription access checking module"
```

### Task 1.8: Create quiz grading module

**Files:**
- Create: `lib/quiz-grading.js`

- [ ] **Step 1: Write quiz grading logic**

```js
// lib/quiz-grading.js

/**
 * Grade a quiz submission.
 * Returns { score, maxScore, passed, results }
 * where results is an array of { questionId, correct, correctAnswer, explanation }
 */
export function gradeQuiz(questions, answers, passMark) {
  let score = 0
  let maxScore = 0

  const results = questions.map((q) => {
    const studentAnswer = answers.find(a => a.questionId === q.id)
    maxScore += q.points

    if (!studentAnswer) {
      return {
        questionId: q.id,
        correct: false,
        studentAnswer: null,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        points: 0,
      }
    }

    let correct = false

    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      correct = studentAnswer.answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
    } else if (q.type === 'short_answer') {
      // Normalize both and check containment for short answers
      const student = studentAnswer.answer.trim().toLowerCase()
      const expected = q.correct_answer.trim().toLowerCase()
      correct = student === expected
    }

    if (correct) score += q.points

    return {
      questionId: q.id,
      correct,
      studentAnswer: studentAnswer.answer,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      points: correct ? q.points : 0,
    }
  })

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const passed = passMark === 0 ? true : percentage >= passMark

  return { score, maxScore, percentage, passed, results }
}

/**
 * Generate feedback for reflection quiz (Quiz 4).
 * Compares student's description against key points from the lesson.
 * Returns { coveredPoints, missedPoints, feedback }
 */
export function gradeReflection(studentResponse, keyPoints) {
  const responseLower = studentResponse.toLowerCase()

  const coveredPoints = []
  const missedPoints = []

  for (const point of keyPoints) {
    // Check if student mentioned keywords related to this point
    const keywords = point.keywords || []
    const mentioned = keywords.some(kw => responseLower.includes(kw.toLowerCase()))

    if (mentioned) {
      coveredPoints.push(point.description)
    } else {
      missedPoints.push(point.description)
    }
  }

  return {
    coveredPoints,
    missedPoints,
    totalPoints: keyPoints.length,
    coveredCount: coveredPoints.length,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/quiz-grading.js
git commit -m "feat: add quiz grading module"
```

### Task 1.9: Create personality question pool module

**Files:**
- Create: `lib/personality.js`

- [ ] **Step 1: Write personality module**

```js
// lib/personality.js

export const PERSONALITY_QUESTIONS = [
  // Quick tier (1-5)
  {
    id: 1,
    question: 'What is your main goal right now?',
    options: [
      { label: 'Learning something new for the first time', tier_weight: { guided: 2, balanced: 1, exam_ready: 0 } },
      { label: 'Revising and strengthening what I know', tier_weight: { guided: 0, balanced: 2, exam_ready: 1 } },
      { label: 'Preparing for exams', tier_weight: { guided: 0, balanced: 1, exam_ready: 2 } },
    ],
  },
  {
    id: 2,
    question: 'How confident do you feel about your studies?',
    options: [
      { label: 'I need a lot of help', tier_weight: { guided: 2, balanced: 1, exam_ready: 0 } },
      { label: 'I know some things but have gaps', tier_weight: { guided: 0, balanced: 2, exam_ready: 1 } },
      { label: 'I feel strong and want a challenge', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
  {
    id: 3,
    question: 'When you get a question wrong, what do you prefer?',
    options: [
      { label: 'See the answer right away so I can learn', tier_weight: { guided: 2, balanced: 0, exam_ready: 0 } },
      { label: 'See it after I finish the quiz', tier_weight: { guided: 0, balanced: 2, exam_ready: 0 } },
      { label: 'Figure it out myself and retry', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
  {
    id: 4,
    question: 'How do you feel about timed tests?',
    options: [
      { label: 'I prefer no time pressure', tier_weight: { guided: 2, balanced: 1, exam_ready: 0 } },
      { label: 'A reasonable time limit is fine', tier_weight: { guided: 0, balanced: 2, exam_ready: 1 } },
      { label: 'Time pressure helps me focus', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
  {
    id: 5,
    question: 'How often do you study?',
    options: [
      { label: 'When I feel like it', tier_weight: { guided: 2, balanced: 1, exam_ready: 0 } },
      { label: 'A few times a week', tier_weight: { guided: 0, balanced: 2, exam_ready: 1 } },
      { label: 'Every day', tier_weight: { guided: 0, balanced: 1, exam_ready: 2 } },
    ],
  },
  // Standard tier (6-10)
  {
    id: 6,
    question: 'Do you prefer reading or watching to learn?',
    options: [
      { label: 'Mostly watching videos', tier_weight: { guided: 1, balanced: 1, exam_ready: 1 } },
      { label: 'A mix of both', tier_weight: { guided: 1, balanced: 1, exam_ready: 1 } },
      { label: 'Mostly reading and notes', tier_weight: { guided: 1, balanced: 1, exam_ready: 1 } },
    ],
  },
  {
    id: 7,
    question: 'When stuck on a problem, what do you do?',
    options: [
      { label: 'Ask for help immediately', tier_weight: { guided: 2, balanced: 0, exam_ready: 0 } },
      { label: 'Try a few times, then ask for help', tier_weight: { guided: 0, balanced: 2, exam_ready: 0 } },
      { label: 'Keep trying until I solve it', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
  {
    id: 8,
    question: 'How do you feel before an exam?',
    options: [
      { label: 'Very anxious — I avoid exams', tier_weight: { guided: 2, balanced: 1, exam_ready: 0 } },
      { label: 'A bit nervous but I manage', tier_weight: { guided: 0, balanced: 2, exam_ready: 1 } },
      { label: 'Excited — I like testing myself', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
  {
    id: 9,
    question: 'How do you handle failing a test?',
    options: [
      { label: 'It discourages me a lot', tier_weight: { guided: 2, balanced: 1, exam_ready: 0 } },
      { label: 'I review what went wrong and move on', tier_weight: { guided: 0, balanced: 2, exam_ready: 1 } },
      { label: 'I see it as motivation to do better', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
  {
    id: 10,
    question: 'What score would make you happy on a test?',
    options: [
      { label: 'Anything above 40% — passing is enough', tier_weight: { guided: 2, balanced: 0, exam_ready: 0 } },
      { label: '60-70% — solid understanding', tier_weight: { guided: 0, balanced: 2, exam_ready: 0 } },
      { label: '80%+ — I want to excel', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
  // Full tier (11-15)
  {
    id: 11,
    question: 'Do you study better alone or with others?',
    options: [
      { label: 'Alone — I go at my own pace', tier_weight: { guided: 1, balanced: 1, exam_ready: 1 } },
      { label: 'With friends — we help each other', tier_weight: { guided: 1, balanced: 1, exam_ready: 1 } },
      { label: 'Both depending on the subject', tier_weight: { guided: 1, balanced: 1, exam_ready: 1 } },
    ],
  },
  {
    id: 12,
    question: 'How many subjects are you struggling with?',
    options: [
      { label: 'Most of them', tier_weight: { guided: 2, balanced: 1, exam_ready: 0 } },
      { label: 'A few', tier_weight: { guided: 0, balanced: 2, exam_ready: 1 } },
      { label: 'None really — I want to improve', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
  {
    id: 13,
    question: 'How important are grades to you?',
    options: [
      { label: 'I just want to understand the material', tier_weight: { guided: 2, balanced: 1, exam_ready: 0 } },
      { label: 'I want good grades and understanding', tier_weight: { guided: 0, balanced: 2, exam_ready: 1 } },
      { label: 'Top grades are my priority', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
  {
    id: 14,
    question: 'When is your next exam?',
    options: [
      { label: 'Not for a while', tier_weight: { guided: 2, balanced: 1, exam_ready: 0 } },
      { label: 'In a few months', tier_weight: { guided: 0, balanced: 2, exam_ready: 1 } },
      { label: 'Very soon — I need to prepare now', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
  {
    id: 15,
    question: 'Would you describe yourself as competitive?',
    options: [
      { label: 'Not really', tier_weight: { guided: 2, balanced: 1, exam_ready: 0 } },
      { label: 'A little — I like doing well', tier_weight: { guided: 0, balanced: 2, exam_ready: 1 } },
      { label: 'Very — I want to be the best', tier_weight: { guided: 0, balanced: 0, exam_ready: 2 } },
    ],
  },
]

/**
 * Get questions for a specific tier count.
 * quick = 5, standard = 10, full = 15
 */
export function getQuestions(count) {
  if (count === 5) return PERSONALITY_QUESTIONS.slice(0, 5)
  if (count === 10) return PERSONALITY_QUESTIONS.slice(0, 10)
  return PERSONALITY_QUESTIONS
}

/**
 * Calculate recommended tier from answers.
 * answers = [{ questionId, optionIndex }]
 */
export function recommendTier(answers) {
  const scores = { guided: 0, balanced: 0, exam_ready: 0 }

  for (const answer of answers) {
    const question = PERSONALITY_QUESTIONS.find(q => q.id === answer.questionId)
    if (!question) continue
    const option = question.options[answer.optionIndex]
    if (!option) continue

    scores.guided += option.tier_weight.guided
    scores.balanced += option.tier_weight.balanced
    scores.exam_ready += option.tier_weight.exam_ready
  }

  if (scores.exam_ready >= scores.balanced && scores.exam_ready >= scores.guided) return 'exam_ready'
  if (scores.balanced >= scores.guided) return 'balanced'
  return 'guided'
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/personality.js
git commit -m "feat: add personality question pool and tier recommendation"
```

---

## Phase 2: Auth, Onboarding & Personalization

### Task 2.1: Update registration page (student-only)

**Files:**
- Modify: `app/auth/register/page.js`

- [ ] **Step 1: Read the current register page**

Read `app/auth/register/page.js` to understand current structure.

- [ ] **Step 2: Rewrite registration for student-only flow**

Remove role selection (tutor option). Add form level selection (Form 1-4). After signup, create a `student_profiles` row. Redirect to `/onboarding` instead of dashboard.

The registration form should collect:
- Full name
- Email
- Password
- Form level (dropdown: Form 1, 2, 3, 4)

On successful signup:
1. Supabase auth creates the user
2. Insert into `profiles` with `role = 'student'`
3. Insert into `student_profiles` with `form_level` and `learning_tier = 'balanced'`
4. Redirect to `/onboarding`

- [ ] **Step 3: Commit**

```bash
git add app/auth/register/page.js
git commit -m "feat: simplify registration to student-only with form level"
```

### Task 2.2: Create onboarding page

**Files:**
- Create: `app/onboarding/page.js`
- Create: `app/onboarding/layout.js`
- Create: `components/onboarding/PersonalityQuiz.js`
- Create: `components/onboarding/TierRecommendation.js`

- [ ] **Step 1: Create onboarding layout (minimal nav)**

```js
// app/onboarding/layout.js
export default function OnboardingLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-green-800">Rent a Tutor</h1>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create PersonalityQuiz component**

A component that:
- Receives `questions` array and `onComplete` callback
- Shows one question at a time with multiple choice options
- Tracks answers as `[{ questionId, optionIndex }]`
- Shows progress bar (question X of Y)
- Calls `onComplete(answers)` when done

- [ ] **Step 3: Create TierRecommendation component**

A component that:
- Receives `recommendedTier` and `onConfirm` callback
- Shows the recommended tier with description
- Shows all 3 tiers so student can override
- Calls `onConfirm(selectedTier)` when student picks

- [ ] **Step 4: Create onboarding page**

The page flow:
1. Welcome message: "We want to get to know you..."
2. Choice: Quick (5) / Standard (10) / Full (15) / Skip for now
3. If not skipped: show PersonalityQuiz with chosen question count
4. Show TierRecommendation with calculated tier
5. Subject interest selection (checkboxes for 11 subjects)
6. Save to `student_profiles` (personality_answers, learning_tier, interested_subjects, onboarding_complete = true)
7. Redirect to `/dashboard/student`

If skipped: set `onboarding_complete = false`, `learning_tier = 'balanced'`, redirect to dashboard.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/ components/onboarding/
git commit -m "feat: add onboarding flow with personality test and tier selection"
```

### Task 2.3: Create settings/personalization page

**Files:**
- Create: `app/dashboard/student/settings/page.js`

- [ ] **Step 1: Create settings page**

The page should:
- Show all 15 personality questions
- Highlight answered vs unanswered
- Allow editing existing answers
- Show current tier with option to change
- Save changes to `student_profiles`
- Show personalization completion banner if not all 15 answered

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/student/settings/page.js
git commit -m "feat: add settings page with personalization section"
```

### Task 2.4: Update login page redirects

**Files:**
- Modify: `app/auth/login/page.js`

- [ ] **Step 1: Update login redirect logic**

After login:
- If `student_profiles.onboarding_complete` is false → redirect to `/onboarding`
- If onboarding complete → redirect to `/dashboard/student`
- If admin → redirect to `/admin`

- [ ] **Step 2: Commit**

```bash
git add app/auth/login/page.js
git commit -m "feat: update login redirects for onboarding flow"
```

---

## Phase 3: Subscription & Payment System

### Task 3.1: Create subscription request API

**Files:**
- Create: `app/api/subscription/request/route.js`

- [ ] **Step 1: Write subscription payment request endpoint**

Similar to existing `/api/payment/request/route.js` but for subscriptions:
- Accepts: `{ phone, planType, subjectId?, formId, termId?, billingType }`
- Validates phone (Zambian format)
- Calculates price based on plan type
- Calls MoneyUnify API
- Stores pending transaction with subscription metadata
- Returns transaction ID

- [ ] **Step 2: Commit**

```bash
git add app/api/subscription/request/route.js
git commit -m "feat: add subscription payment request API"
```

### Task 3.2: Create subscription verify API

**Files:**
- Create: `app/api/subscription/verify/route.js`

- [ ] **Step 1: Write subscription payment verification endpoint**

- Accepts: `{ transactionId }`
- Calls MoneyUnify verify
- On success: create `subscriptions` row with correct `expires_at` based on plan type:
  - subject: 1 month from now
  - term: 4 months from now
  - form: 12 months from now
- Delete pending transaction
- Return subscription details

- [ ] **Step 2: Commit**

```bash
git add app/api/subscription/verify/route.js
git commit -m "feat: add subscription payment verification API"
```

### Task 3.3: Create Paywall component

**Files:**
- Create: `components/lesson/Paywall.js`

- [ ] **Step 1: Write Paywall component**

Shown when a student tries to access content they're not subscribed to. Displays:
- What they need access to (subject, form, term)
- Three plan options (subject/term/form) with prices and durations
- Monthly vs one-time toggle
- Payment modal (reuse existing phone + network selection pattern from the old lesson purchase flow)

- [ ] **Step 2: Commit**

```bash
git add components/lesson/Paywall.js
git commit -m "feat: add subscription paywall component"
```

---

## Phase 4: Content Browsing & Lesson Player

### Task 4.1: Create content navigation pages

**Files:**
- Create: `app/learn/page.js` — Form selection
- Create: `app/learn/[formId]/page.js` — Term selection
- Create: `app/learn/[formId]/[termId]/page.js` — Subject grid
- Create: `app/learn/[formId]/[termId]/[subjectSlug]/page.js` — Units + topics

- [ ] **Step 1: Create form selection page (`/learn`)**

Shows 4 cards for Form 1-4. Each card shows:
- Form name
- Number of subjects available
- Student's progress if subscribed (progress bar)

Fetches forms from `forms` table.

- [ ] **Step 2: Create term selection page (`/learn/[formId]`)**

Shows 3 cards for Term 1-3. Each shows:
- Term name
- Number of subjects with published content
- Student's progress if subscribed

Fetches terms for the given form.

- [ ] **Step 3: Create subject grid page (`/learn/[formId]/[termId]`)**

Shows grid of 11 subject cards. Each shows:
- Subject name and icon
- Number of published lessons
- "Coming soon" if no published lessons
- Lock icon if not subscribed, progress ring if subscribed

Fetches subjects + counts from units/topics/lessons_new for this form/term.

- [ ] **Step 4: Create units + topics page (`/learn/[formId]/[termId]/[subjectSlug]`)**

Shows units in order. Each unit contains topics. Units unlock sequentially (Unit 2 locked until Unit 1 topics all completed). Topics within a unit can be done in any order.

Each topic shows:
- Title
- Number of lessons
- Completion status (check mark, in progress, locked)

Fetches units → topics → lesson counts. Checks student_progress for completion.

- [ ] **Step 5: Commit**

```bash
git add app/learn/
git commit -m "feat: add content navigation (form → term → subject → unit/topic)"
```

### Task 4.2: Create topic lessons page

**Files:**
- Create: `app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/page.js`

- [ ] **Step 1: Create lessons list page**

Shows all lessons in a topic in order. Each lesson shows:
- Title, description
- Status (completed / in progress / not started / coming soon)
- Completion progress (e.g., "3/8 sections done")
- Click to enter lesson player

Check subscription access — if not subscribed, show Paywall component.

- [ ] **Step 2: Commit**

```bash
git add app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/page.js
git commit -m "feat: add topic lessons list page"
```

### Task 4.3: Create lesson player page

**Files:**
- Create: `app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/lesson/[lessonId]/page.js`
- Create: `components/lesson/VideoPlayer.js`
- Create: `components/lesson/SlideViewer.js`
- Create: `components/lesson/QuizPlayer.js`
- Create: `components/lesson/LessonProgress.js`

- [ ] **Step 1: Create VideoPlayer component**

Handles both Cloudflare Stream and YouTube embeds (reuse detection logic from existing lesson detail page). Props: `cloudflareVideoId`, `contentUrl`.

- [ ] **Step 2: Create SlideViewer component**

Renders slides from JSON data. Each slide has content (text, images, bullet points). Navigation: prev/next buttons, slide counter. Props: `slidesData` (JSON array).

- [ ] **Step 3: Create QuizPlayer component**

Handles all 4 quiz types:
- `lesson_mc`: 10 multiple choice questions
- `lesson_mc_tf`: 10 MC + true/false questions
- `lesson_short`: 10 short answer questions
- `lesson_reflection`: 1 free-form text area

Props: `quiz`, `questions`, `tierConfig`, `onComplete`

Shows questions one at a time or all at once (based on quiz type). Submit button. Shows results based on tier config (immediate, after submit, or after pass). Retry button if failed (based on tier config).

Calls `/api/quiz/submit` or `/api/quiz/reflection` on submit.

- [ ] **Step 4: Create LessonProgress component**

Horizontal progress bar showing lesson sections. Current section highlighted. Completed sections have check marks. Props: `sections`, `currentIndex`, `completedSections`.

- [ ] **Step 5: Create lesson player page**

The main lesson page. Loads lesson with all sections and quizzes. Shows them in linear order:

1. Video 1 (intro) — always visible (FREE)
2. Check subscription — if no access, show Paywall after Video 1
3. Slides Section 1 → Quiz 1
4. Video 2 → Slides Section 2 → Quiz 2
5. Video 3 → Slides Section 3 → Quiz 3
6. Video 4 (closing) → Quiz 4 (reflection)
7. Lesson complete screen — XP awarded, "Next lesson" button

Each section completion calls `/api/progress` to record progress.
Each quiz completion calls `/api/quiz/submit`.
XP awarded via `increment_xp` RPC after quiz pass.

State management: track current section index, completed sections, quiz results. Persist to `student_progress` table.

- [ ] **Step 6: Commit**

```bash
git add app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/lesson/ components/lesson/
git commit -m "feat: add lesson player with video, slides, and quiz flow"
```

### Task 4.4: Create quiz submission APIs

**Files:**
- Create: `app/api/quiz/submit/route.js`
- Create: `app/api/quiz/reflection/route.js`
- Create: `app/api/progress/route.js`

- [ ] **Step 1: Create quiz submit API**

Accepts: `{ quizId, answers: [{ questionId, answer }] }`
- Fetch quiz + questions from DB
- Get student's tier from `student_profiles`
- Get tier config for pass mark
- Call `gradeQuiz()` from `lib/quiz-grading.js`
- Insert `quiz_attempts` row
- If passed: award XP via `increment_xp` RPC, call `record_activity` RPC
- Check for achievements (first attempt pass, perfect score)
- Return: `{ score, maxScore, percentage, passed, results }`

Filter results based on tier's `show_explanations` setting:
- `immediate`: include explanations for wrong answers
- `after_submit`: include all explanations
- `after_pass`: only include explanations if passed

- [ ] **Step 2: Create reflection submit API**

Accepts: `{ quizId, response: "student's free text" }`
- Fetch quiz's key points (stored in quiz_questions as a single free_form question with `options` containing key points)
- Call `gradeReflection()` from `lib/quiz-grading.js`
- Insert `quiz_attempts` row with feedback JSON
- Award XP for completion (always — reflection can't fail)
- Return: `{ coveredPoints, missedPoints, totalPoints, coveredCount }`

- [ ] **Step 3: Create progress API**

Accepts: `{ lessonId, sectionId }`
- Insert into `student_progress` (upsert, ignore duplicate)
- Call `record_activity` RPC
- Award section completion XP
- Return: `{ success: true }`

- [ ] **Step 4: Commit**

```bash
git add app/api/quiz/ app/api/progress/
git commit -m "feat: add quiz submission and progress tracking APIs"
```

### Task 4.5: Create topic test and term exam pages

**Files:**
- Modify: `app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/page.js` — Add topic test button
- Create: `app/learn/[formId]/[termId]/[subjectSlug]/topic-test/[topicId]/page.js`
- Create: `app/learn/[formId]/[termId]/term-exam/[subjectSlug]/page.js`

- [ ] **Step 1: Create topic test page**

Shows when all lessons in a topic are complete. Uses QuizPlayer component with `topic_test` quiz type. Tier-specific configuration (question count, time limit, pass mark). On completion: award XP, check achievements.

- [ ] **Step 2: Create term exam page**

Shows when all topics in a term for a subject are complete. Uses QuizPlayer with `term_exam` quiz type. Tier-specific configuration. Adaptive question selection (weight toward weak topics). On completion: show results report (format depends on tier).

- [ ] **Step 3: Update topic page to show test button**

Add "Take Topic Test" button that appears when all lessons are complete. Show lock icon if lessons incomplete.

- [ ] **Step 4: Commit**

```bash
git add app/learn/
git commit -m "feat: add topic test and term exam pages"
```

---

## Phase 5: Student Dashboard & Gamification

### Task 5.1: Redesign student dashboard

**Files:**
- Modify: `app/dashboard/student/page.js`
- Create: `components/dashboard/ProgressRings.js`
- Create: `components/dashboard/StreakCounter.js`
- Create: `components/dashboard/XPBar.js`
- Create: `components/dashboard/ActivityFeed.js`
- Create: `components/dashboard/LeaderboardPreview.js`

- [ ] **Step 1: Create ProgressRings component**

Shows circular progress rings for each subscribed subject. Props: `subjects` (array of { name, slug, percentComplete }). Uses SVG circles.

- [ ] **Step 2: Create StreakCounter component**

Shows current streak with flame icon. Props: `days`. Shows milestone badges next to it.

- [ ] **Step 3: Create XPBar component**

Shows current XP, level, and progress to next level. Props: `xpTotal`, `currentLevel`. Uses `getXPForNextLevel()` from `lib/xp.js`.

- [ ] **Step 4: Create ActivityFeed component**

Shows recent activity: quiz results, lessons completed, XP earned, badges. Props: `activities` (array). Fetched from `quiz_attempts` + `student_progress` + `student_achievements`, ordered by date.

- [ ] **Step 5: Create LeaderboardPreview component**

Shows top 5 students for this week + current student's rank. Props: `leaderboard`, `currentRank`. Scoped by form level.

- [ ] **Step 6: Rewrite student dashboard page**

Top section:
- "Continue learning" button (next incomplete lesson)
- ProgressRings for subscribed subjects
- StreakCounter + XPBar side by side

Bottom section:
- ActivityFeed
- LeaderboardPreview

Personalization nudge banner if `onboarding_complete` is false.

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/student/page.js components/dashboard/
git commit -m "feat: redesign student dashboard with progress, XP, streaks, and activity"
```

### Task 5.2: Create leaderboard page

**Files:**
- Create: `app/dashboard/student/leaderboard/page.js`

- [ ] **Step 1: Create leaderboard page**

Full leaderboard with:
- Weekly / Monthly toggle
- Scoped by form level (student sees their form's leaderboard)
- Top 3 highlighted with badges
- Current student highlighted wherever they rank
- Columns: rank, name, XP earned, level

Query: aggregate XP from `quiz_attempts` and `student_progress` for the time period, grouped by student, filtered by form level from `student_profiles`.

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/student/leaderboard/page.js
git commit -m "feat: add weekly/monthly leaderboard page"
```

### Task 5.3: Achievement checking logic

**Files:**
- Create: `lib/achievements.js`

- [ ] **Step 1: Write achievement checker**

```js
// lib/achievements.js

/**
 * Check and award achievements after an action.
 * Call this after quiz completion, lesson completion, etc.
 */
export async function checkAchievements(supabase, studentId, action) {
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*')

  const { data: earned } = await supabase
    .from('student_achievements')
    .select('achievement_id')
    .eq('student_id', studentId)

  const earnedIds = new Set((earned || []).map(e => e.achievement_id))
  const newAchievements = []

  for (const achievement of (allAchievements || [])) {
    if (earnedIds.has(achievement.id)) continue

    const met = await checkCriteria(supabase, studentId, achievement, action)
    if (met) {
      await supabase.from('student_achievements').insert({
        student_id: studentId,
        achievement_id: achievement.id,
      })
      newAchievements.push(achievement)
    }
  }

  return newAchievements
}

async function checkCriteria(supabase, studentId, achievement, action) {
  const { criteria_type, criteria_value } = achievement

  switch (criteria_type) {
    case 'lessons_completed': {
      const { count } = await supabase
        .from('student_progress')
        .select('lesson_id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .not('section_id', 'is', null)
      // Rough: count distinct lessons where all sections are done
      // Simplified: count progress rows as proxy
      return (count || 0) >= criteria_value.count
    }
    case 'perfect_quiz': {
      const { count } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('score', supabase.raw('max_score'))
      return (count || 0) >= criteria_value.count
    }
    case 'streak': {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('current_streak')
        .eq('user_id', studentId)
        .single()
      return (profile?.current_streak || 0) >= criteria_value.days
    }
    case 'first_attempt_pass': {
      const { count } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('attempt_number', 1)
        .eq('passed', true)
      return (count || 0) >= criteria_value.count
    }
    default:
      return false
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/achievements.js
git commit -m "feat: add achievement checking logic"
```

---

## Phase 6: Admin Panel

### Task 6.1: Create admin layout and dashboard

**Files:**
- Create: `app/admin/layout.js`
- Create: `app/admin/page.js`
- Create: `components/admin/AdminShell.js`
- Create: `components/admin/AnalyticsCards.js`

- [ ] **Step 1: Create AdminShell component**

Sidebar navigation with links:
- Dashboard (overview)
- Content (manage lessons)
- Students
- Subscriptions

- [ ] **Step 2: Create AnalyticsCards component**

Cards showing: total students, active subscriptions, revenue this month, average quiz score. Each card fetches an aggregate count from the relevant table.

- [ ] **Step 3: Create admin layout**

Wraps children with AdminShell sidebar. Checks `profiles.role === 'admin'` on mount. Redirects non-admins.

- [ ] **Step 4: Create admin dashboard page**

Shows AnalyticsCards at top. Below: recent subscriptions list, content coverage overview (which subjects/forms have published content), most/least popular subjects by subscription count.

- [ ] **Step 5: Commit**

```bash
git add app/admin/ components/admin/
git commit -m "feat: add admin layout and analytics dashboard"
```

### Task 6.2: Create content management pages

**Files:**
- Create: `app/admin/content/page.js`
- Create: `app/admin/content/[lessonId]/page.js`
- Create: `components/admin/ContentEditor.js`
- Create: `components/admin/QuizEditor.js`
- Create: `app/api/admin/content/route.js`
- Create: `app/api/admin/quiz-questions/route.js`

- [ ] **Step 1: Create content management API**

CRUD endpoints for:
- Units (create, update, delete)
- Topics (create, update, delete, reorder)
- Lessons (create, update, delete, reorder, change status)
- Lesson sections (create, update, delete, reorder)

All require admin role check.

- [ ] **Step 2: Create quiz questions API**

CRUD for quiz questions:
- Create questions for a quiz
- Update question text/options/correct answer
- Delete questions
- Bulk import (accept array of questions)

Admin role check required.

- [ ] **Step 3: Create content management page**

Tree view: Subject → Form → Term → Unit → Topic → Lesson
Click a lesson to edit. Create new units/topics/lessons inline.
Status badges (published/draft/coming_soon).

- [ ] **Step 4: Create lesson editor page**

Edit a specific lesson:
- Title, description, status
- Manage sections (add/remove/reorder video and slides sections)
- For video sections: paste Cloudflare Stream ID
- For slides sections: JSON editor for slide content
- Manage quizzes: 4 quizzes per lesson, edit questions for each

Uses ContentEditor and QuizEditor components.

- [ ] **Step 5: Commit**

```bash
git add app/admin/content/ components/admin/ContentEditor.js components/admin/QuizEditor.js app/api/admin/
git commit -m "feat: add admin content management with lesson and quiz editors"
```

### Task 6.3: Create student management page

**Files:**
- Create: `app/admin/students/page.js`
- Create: `app/admin/subscriptions/page.js`

- [ ] **Step 1: Create students page**

Table of all students with:
- Name, email, form level, learning tier
- XP, level, streak
- Subscription status
- Search and filter

Click a student to see: quiz scores, progress, subscription history.

- [ ] **Step 2: Create subscriptions page**

Table of all subscriptions:
- Student name, plan type, subject/form/term, status, expires at, price paid
- Filter by status (active/expired/cancelled)
- Manual activate/deactivate buttons

- [ ] **Step 3: Commit**

```bash
git add app/admin/students/ app/admin/subscriptions/
git commit -m "feat: add admin student and subscription management"
```

---

## Phase 7: Cleanup & Middleware Update

### Task 7.1: Update middleware for new routes

**Files:**
- Modify: `middleware.js`

- [ ] **Step 1: Update middleware**

Changes:
- Remove `PROTECTED_TUTOR` routes
- Add `/onboarding` to protected routes (requires auth)
- Add `/learn` to protected routes (requires auth)
- Keep `/admin` protection (requires admin role)
- Update redirects: remove tutor redirects, add onboarding check
- When student hits `/dashboard` without complete onboarding, redirect to `/onboarding`

```js
const PROTECTED_STUDENT = ['/dashboard/student', '/learn', '/onboarding']
const ADMIN_ROUTES = ['/admin']
const AUTH_ROUTES = ['/auth/login', '/auth/register']
```

- [ ] **Step 2: Commit**

```bash
git add middleware.js
git commit -m "feat: update middleware for new route structure"
```

### Task 7.2: Update Navbar

**Files:**
- Modify: `components/layout/Navbar.js`

- [ ] **Step 1: Update navigation links**

For logged-in students:
- Dashboard
- Learn (→ /learn)
- Leaderboard (→ /dashboard/student/leaderboard)
- Settings (→ /dashboard/student/settings)

For admins:
- Admin (→ /admin)

Remove tutor-specific nav items.

- [ ] **Step 2: Commit**

```bash
git add components/layout/Navbar.js
git commit -m "feat: update navbar for new platform navigation"
```

### Task 7.3: Update homepage

**Files:**
- Modify: `app/page.js`

- [ ] **Step 1: Rewrite homepage**

Update to reflect the new platform:
- Hero: "Learn smarter with Zambia's curriculum" — subscribe and start learning
- Subject grid (11 subjects)
- How it works (subscribe → learn → quiz → track progress)
- Pricing preview (3 plan tiers)
- CTA: Sign up / Login

Remove: tutor browsing, featured tutors, topic requests.

- [ ] **Step 2: Commit**

```bash
git add app/page.js
git commit -m "feat: update homepage for self-serve learning platform"
```

### Task 7.4: Simplify ThemeContext

**Files:**
- Modify: `context/ThemeContext.js`

- [ ] **Step 1: Simplify to student-only theme**

Remove tutor green theme toggle. Single consistent theme for all students. Keep the context structure for future use but remove role-based switching.

- [ ] **Step 2: Commit**

```bash
git add context/ThemeContext.js
git commit -m "feat: simplify theme to student-only"
```

### Task 7.5: Delete old tutor/marketplace files

**Files:**
- Delete: `app/tutor/` (entire directory)
- Delete: `app/dashboard/tutor/` (entire directory)
- Delete: `app/browse/` (entire directory)
- Delete: `app/api/topic-requests/` (entire directory)
- Delete: `app/dashboard/student/purchases/` (directory)
- Delete: `app/dashboard/student/topic-requests/` (directory)
- Delete: `components/TopicRequestFeed.js`
- Delete: `components/TopicRequestForm.js`

- [ ] **Step 1: Delete old files**

```bash
rm -rf app/tutor app/dashboard/tutor app/browse app/api/topic-requests
rm -rf app/dashboard/student/purchases app/dashboard/student/topic-requests
rm components/TopicRequestFeed.js components/TopicRequestForm.js
```

- [ ] **Step 2: Verify no import errors**

```bash
npm run build
```

Fix any broken imports that reference deleted files.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old tutor marketplace code"
```

### Task 7.6: Update student dashboard layout

**Files:**
- Modify: `app/dashboard/student/layout.js`
- Modify: `components/layout/DashboardShell.js`

- [ ] **Step 1: Update DashboardShell navigation**

Remove tutor-specific links. Update student links to:
- Dashboard
- Learn
- Leaderboard
- Settings

- [ ] **Step 2: Update student layout**

Ensure it wraps with the updated DashboardShell. Remove any references to purchases or topic requests.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/student/layout.js components/layout/DashboardShell.js
git commit -m "feat: update dashboard shell for new navigation"
```

### Task 7.7: Final build verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

- [ ] **Step 2: Fix any build errors**

Address any remaining broken imports, missing components, or type errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: resolve build errors after platform redesign"
```

---

## Execution Order Summary

```
Phase 1 (Tasks 1.1-1.9): Database + core modules
  ↓
Phase 2 (Tasks 2.1-2.4): Auth + onboarding
  ↓
Phase 3 (Tasks 3.1-3.3): Subscriptions + payments
  ↓
Phase 4 (Tasks 4.1-4.5): Content browsing + lesson player
  ↓
Phase 5 (Tasks 5.1-5.3): Dashboard + gamification
  ↓
Phase 6 (Tasks 6.1-6.3): Admin panel
  ↓
Phase 7 (Tasks 7.1-7.7): Cleanup + final verification
```

Total: 7 phases, 28 tasks.
