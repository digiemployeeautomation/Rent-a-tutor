-- ============================================================
-- Migration 001: Platform Redesign Schema
-- Redesign from tutor marketplace to subscription-based
-- learning platform
-- ============================================================

-- ============================================================
-- 1. subjects_new
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects_new (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        UNIQUE NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. forms
-- ============================================================
CREATE TABLE IF NOT EXISTS forms (
  id    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER UNIQUE NOT NULL CHECK (level BETWEEN 1 AND 4),
  name  TEXT    NOT NULL
);

-- ============================================================
-- 3. terms
-- ============================================================
CREATE TABLE IF NOT EXISTS terms (
  id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID    NOT NULL REFERENCES forms (id) ON DELETE CASCADE,
  number  INTEGER NOT NULL CHECK (number BETWEEN 1 AND 3),
  name    TEXT    NOT NULL,
  UNIQUE (form_id, number)
);

-- ============================================================
-- 4. units
-- ============================================================
CREATE TABLE IF NOT EXISTS units (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id     UUID    NOT NULL REFERENCES terms       (id) ON DELETE CASCADE,
  subject_id  UUID    NOT NULL REFERENCES subjects_new(id) ON DELETE CASCADE,
  number      INTEGER NOT NULL,
  title       TEXT    NOT NULL,
  description TEXT,
  UNIQUE (term_id, subject_id, number)
);

-- ============================================================
-- 5. topics
-- ============================================================
CREATE TABLE IF NOT EXISTS topics (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID    NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  description TEXT,
  "order"     INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 6. lessons_new
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons_new (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id    UUID        NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  "order"     INTEGER     NOT NULL DEFAULT 0,
  status      TEXT        NOT NULL DEFAULT 'coming_soon'
                          CHECK (status IN ('draft', 'published', 'coming_soon')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. lesson_sections
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_sections (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id           UUID        NOT NULL REFERENCES lessons_new(id) ON DELETE CASCADE,
  type                TEXT        NOT NULL CHECK (type IN ('video', 'slides')),
  "order"             INTEGER     NOT NULL,
  content_url         TEXT,
  cloudflare_video_id TEXT,
  slides_data         JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. quizzes
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   UUID        REFERENCES lessons_new  (id) ON DELETE CASCADE,
  topic_id    UUID        REFERENCES topics       (id) ON DELETE CASCADE,
  term_id     UUID        REFERENCES terms        (id) ON DELETE CASCADE,
  subject_id  UUID        REFERENCES subjects_new (id) ON DELETE CASCADE,
  quiz_type   TEXT        NOT NULL CHECK (
                quiz_type IN (
                  'lesson_mc',
                  'lesson_mc_tf',
                  'lesson_short',
                  'lesson_reflection',
                  'topic_test',
                  'term_exam'
                )
              ),
  "order"     INTEGER     NOT NULL DEFAULT 0,
  tier_config JSONB       NOT NULL DEFAULT '{
    "guided":     {"time_limit": null, "show_hints": true,  "pass_threshold": 60},
    "balanced":   {"time_limit": null, "show_hints": false, "pass_threshold": 70},
    "exam_ready": {"time_limit": 30,   "show_hints": false, "pass_threshold": 80}
  }'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. quiz_questions
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID    NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type           TEXT    NOT NULL CHECK (
                   type IN ('multiple_choice', 'true_false', 'short_answer', 'free_form')
                 ),
  question_text  TEXT    NOT NULL,
  options        JSONB,
  correct_answer TEXT,
  explanation    TEXT,
  points         INTEGER NOT NULL DEFAULT 1,
  "order"        INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 10. subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type    TEXT        NOT NULL CHECK (plan_type IN ('subject', 'term', 'form')),
  subject_id   UUID        REFERENCES subjects_new(id),
  form_id      UUID        REFERENCES forms       (id),
  term_id      UUID        REFERENCES terms       (id),
  billing_type TEXT        NOT NULL CHECK (billing_type IN ('monthly', 'one_time')),
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'cancelled', 'expired')),
  starts_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  price_paid   INTEGER     NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. student_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS student_profiles (
  id                   UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID      UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         TEXT,
  avatar_url           TEXT,
  learning_tier        TEXT      NOT NULL DEFAULT 'balanced'
                                 CHECK (learning_tier IN ('guided', 'balanced', 'exam_ready')),
  personality_answers  JSONB     NOT NULL DEFAULT '[]',
  onboarding_complete  BOOLEAN   NOT NULL DEFAULT false,
  xp_total             INTEGER   NOT NULL DEFAULT 0,
  current_level        INTEGER   NOT NULL DEFAULT 1,
  current_streak       INTEGER   NOT NULL DEFAULT 0,
  interested_subjects  UUID[]    NOT NULL DEFAULT '{}',
  form_level           INTEGER   CHECK (form_level BETWEEN 1 AND 4),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. student_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS student_progress (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES auth.users    (id) ON DELETE CASCADE,
  lesson_id    UUID        NOT NULL REFERENCES lessons_new   (id) ON DELETE CASCADE,
  section_id   UUID        REFERENCES lesson_sections(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_id, section_id)
);

-- ============================================================
-- 13. quiz_attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id        UUID        NOT NULL REFERENCES quizzes   (id) ON DELETE CASCADE,
  tier           TEXT        NOT NULL CHECK (tier IN ('guided', 'balanced', 'exam_ready')),
  score          INTEGER     NOT NULL DEFAULT 0,
  max_score      INTEGER     NOT NULL,
  passed         BOOLEAN     NOT NULL DEFAULT false,
  answers        JSONB       NOT NULL DEFAULT '[]',
  feedback       JSONB,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ,
  attempt_number INTEGER     NOT NULL DEFAULT 1
);

-- ============================================================
-- 14. achievements
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT  UNIQUE NOT NULL,
  description     TEXT  NOT NULL,
  icon            TEXT,
  criteria_type   TEXT  NOT NULL,
  criteria_value  JSONB NOT NULL
);

-- ============================================================
-- 15. student_achievements
-- ============================================================
CREATE TABLE IF NOT EXISTS student_achievements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID        NOT NULL REFERENCES auth.users  (id) ON DELETE CASCADE,
  achievement_id UUID        NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, achievement_id)
);

-- ============================================================
-- 16. streaks
-- ============================================================
CREATE TABLE IF NOT EXISTS streaks (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           DATE    NOT NULL DEFAULT CURRENT_DATE,
  activity_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE (student_id, date)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- subjects_new
CREATE INDEX IF NOT EXISTS idx_subjects_new_slug        ON subjects_new (slug);

-- terms
CREATE INDEX IF NOT EXISTS idx_terms_form_id            ON terms        (form_id);

-- units
CREATE INDEX IF NOT EXISTS idx_units_term_id            ON units        (term_id);
CREATE INDEX IF NOT EXISTS idx_units_subject_id         ON units        (subject_id);

-- topics
CREATE INDEX IF NOT EXISTS idx_topics_unit_id           ON topics       (unit_id);
CREATE INDEX IF NOT EXISTS idx_topics_order             ON topics       (unit_id, "order");

-- lessons_new
CREATE INDEX IF NOT EXISTS idx_lessons_new_topic_id     ON lessons_new  (topic_id);
CREATE INDEX IF NOT EXISTS idx_lessons_new_status       ON lessons_new  (status);
CREATE INDEX IF NOT EXISTS idx_lessons_new_order        ON lessons_new  (topic_id, "order");

-- lesson_sections
CREATE INDEX IF NOT EXISTS idx_lesson_sections_lesson   ON lesson_sections (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sections_order    ON lesson_sections (lesson_id, "order");

-- quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id        ON quizzes (lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic_id         ON quizzes (topic_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_term_id          ON quizzes (term_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id       ON quizzes (subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_type        ON quizzes (quiz_type);

-- quiz_questions
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id   ON quiz_questions (quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order     ON quiz_questions (quiz_id, "order");

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_student    ON subscriptions (student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status     ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subject    ON subscriptions (subject_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_form       ON subscriptions (form_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_term       ON subscriptions (term_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires    ON subscriptions (expires_at);

-- student_profiles
CREATE INDEX IF NOT EXISTS idx_student_profiles_user    ON student_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_tier    ON student_profiles (learning_tier);
CREATE INDEX IF NOT EXISTS idx_student_profiles_level   ON student_profiles (current_level);

-- student_progress
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress (student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_lesson  ON student_progress (lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_section ON student_progress (section_id);

-- quiz_attempts
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student    ON quiz_attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz       ON quiz_attempts (quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_started    ON quiz_attempts (started_at);

-- student_achievements
CREATE INDEX IF NOT EXISTS idx_student_achievements_student    ON student_achievements (student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_achievement ON student_achievements (achievement_id);

-- streaks
CREATE INDEX IF NOT EXISTS idx_streaks_student          ON streaks (student_id);
CREATE INDEX IF NOT EXISTS idx_streaks_date             ON streaks (date);

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- increment_xp: safely increments xp_total for a user
CREATE OR REPLACE FUNCTION increment_xp(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE student_profiles
  SET xp_total = xp_total + p_amount
  WHERE user_id = p_user_id;
END;
$$;

-- record_activity: upserts a streak record for the current date
CREATE OR REPLACE FUNCTION record_activity(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO streaks (student_id, date, activity_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (student_id, date)
  DO UPDATE SET activity_count = streaks.activity_count + 1;
END;
$$;
