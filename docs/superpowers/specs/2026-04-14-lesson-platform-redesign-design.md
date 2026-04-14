# Rent a Tutor — Platform Redesign: Self-Serve Learning Platform

## Overview

Rent a Tutor is pivoting from a tutor marketplace to a subscription-based, self-serve learning platform for Zambian O-Level students (Form 1-4). All content (slides + videos) is produced in-house and aligned with the 2024 Zambia Education Curriculum. The platform features structured lessons, progressive quizzes, personalized learning tiers, gamification, and exam preparation.

## 1. Content Architecture

### Hierarchy

```
Form (Form 1, 2, 3, 4)
  └── Term (Term 1, 2, 3)
       └── Subject (11 subjects from new Zambian curriculum)
            └── Unit (grouped topics, unlock sequentially)
                 └── Topic (within a unit, any order)
                      └── Lesson (linear sequence)
                           ├── Video 1 (intro) — FREE for everyone
                           ├── Slides Section 1 → Quiz 1 (10 MC)
                           ├── Video 2
                           ├── Slides Section 2 → Quiz 2 (10 MC + T/F)
                           ├── Video 3
                           ├── Slides Section 3 → Quiz 3 (10 short answer)
                           ├── Video 4 (closing)
                           └── Quiz 4 (free-form reflection — feedback only, not graded)
```

### Subjects (from Ministry of Education 2024 syllabi)

1. Agricultural Science
2. Biology
3. Chemistry
4. Civic Education
5. English Language
6. Food & Nutrition
7. Geography
8. History
9. Mathematics
10. Physical Education & Sport
11. Religious Education

### Content state

All content structures (subjects, forms, terms, units, topics, lessons) exist in the database as a skeleton from day one. Lessons without uploaded videos/slides show as "Coming soon" and are not accessible. Content is uploaded progressively.

## 2. Assessments

### Lesson Quizzes (4 per lesson)

| Quiz | Position | Format | Questions |
|------|----------|--------|-----------|
| Quiz 1 | After Slides Section 1 | Multiple choice | 10 |
| Quiz 2 | After Slides Section 2 | Multiple choice + true/false | 10 |
| Quiz 3 | After Slides Section 3 | Short answer | 10 |
| Quiz 4 | After closing video | Free-form reflection | 1 (describe everything learned) |

Quiz 4 is not graded pass/fail. The system analyzes the student's response, highlights what they covered well, and points out what they missed.

### Topic Test (after all lessons in a topic)

| Feature | Guided | Balanced | Exam Ready |
|---------|--------|----------|------------|
| Questions | 20 | 30 | 40 |
| Time limit | None | 45 min | 30 min |
| Pass mark | 50% | 60% | 75% |
| Retries | Unlimited | Up to 3 | Unlimited, full reset |
| Format | Mix of MC + T/F + short answer | All types + short describe | Weighted toward short answer + free-form |
| Feedback | After each wrong answer | After submitting full test | After passing only |

### Term Exam (after all topics in a term)

| Feature | Guided | Balanced | Exam Ready |
|---------|--------|----------|------------|
| Questions | 40 | 60 | 80 |
| Time limit | None | 90 min | 60 min |
| Pass mark | 50% | 60% | 75% |
| Format | Organized by topic | Exam-paper sections (A: MC, B: short answer, C: long answer) | ECZ exam format with mark allocations |
| Retries | Unlimited | Up to 2 | Unlimited, full reset |
| After completion | Strengths/weaknesses summary | Detailed breakdown + study recommendations | Mock exam report card with predicted grade |

All term exams pull questions adaptively — heavier weighting on topics where the student scored lower during lesson quizzes and topic tests.

## 3. Learning Tiers

Students choose their tier during onboarding via a personality test. They can switch tiers anytime in Settings.

### Tier definitions

| Feature | Guided (Relaxed) | Balanced (Recommended) | Exam Ready (Strict) |
|---------|-------------------|------------------------|---------------------|
| Lesson quiz pass threshold | Can proceed regardless | 60%+ to proceed | 80%+ to proceed |
| Wrong answer feedback | Immediate | After submission | After passing only |
| Quiz retries | Unlimited | Up to 3, then unlocks | Unlimited, full reset |
| Progress focus | Completion | Completion + scores | Scores + weak areas |

## 4. Onboarding & Personalization

### Flow

1. **Sign up** — email, password, name, form level
2. **Welcome screen** — "We want to get to know you so we can help you learn the best way possible. How many questions can you answer right now?"
   - Quick (5 questions) — ~1 minute
   - Standard (10 questions) — ~2 minutes
   - Full (15 questions) — ~5 minutes
   - Skip for now
3. **Personality questions** — drawn from pool of 15 questions covering:
   - Study habits
   - Confidence level
   - Goals (revising vs learning for first time)
   - Learning style preference
   - Pressure tolerance
4. **Tier recommendation** — system recommends Guided, Balanced, or Exam Ready. Student can accept or override.
5. **Subject selection** — student picks subjects they're interested in (for dashboard personalization, not access control)
6. **Dashboard** — land on hybrid dashboard

### If they skip personalization

- Default to Balanced tier
- After first lesson or first quiz: gentle banner — "Complete your profile to unlock a personalized learning experience"
- Banner dismisses after one interaction, doesn't nag

### Settings > Personalization

- All 15 questions available anytime
- Answered questions show current answer (editable)
- Unanswered questions highlighted
- Tier can be changed anytime

## 5. Subscription & Access Control

### Plans

| Plan | Scope | Duration |
|------|-------|----------|
| Per Subject | 1 subject, 1 term, 1 form | 1 month |
| Per Term | All subjects, 1 term, 1 form | 4 months |
| Per Form | All subjects, all terms, 1 form | 12 months |

### Billing options

- **Monthly recurring** — pays monthly until cancelled or duration reached
  - Per Subject: monthly, cancel anytime
  - Per Term: monthly for up to 4 months, then expires
  - Per Form: monthly for up to 12 months, then expires
- **One-time** — pays once for the full duration at a discount
  - Per Subject: 1 month access
  - Per Term: 4 months access
  - Per Form: 12 months access

### Access logic

1. Student tries to access lesson content beyond the intro video
2. Check if they have an active subscription covering that subject + form + term
3. If yes → full access
4. If no → paywall showing subscription options relevant to what they're trying to access

### Free access (no subscription needed)

- Account creation and onboarding
- Personality test / personalization
- First intro video of every lesson
- Dashboard (shows progress on subscribed content, previews for the rest)

### Payment

- MoneyUnify API (Airtel Money, MTN MoMo, Zamtel Kwacha)
- Adapted from one-time purchase flow to subscription model
- Subscription record created on successful payment
- Monthly recurring: expires_at set to 30 days, renew on payment
- One-time: expires_at set based on plan duration (1/4/12 months)

## 6. Database Schema

### New tables

**`subjects`**
- id, name, slug, description, icon

**`forms`**
- id, level (1-4), name

**`terms`**
- id, form_id, number (1-3), name

**`units`**
- id, term_id, subject_id, number, title, description

**`topics`**
- id, unit_id, title, description, order

**`lessons`**
- id, topic_id, title, description, order, status (draft/published/coming_soon)

**`lesson_sections`**
- id, lesson_id, type (video/slides), order, content_url, cloudflare_video_id, slides_data (JSON)

**`quizzes`**
- id, lesson_id (nullable), topic_id (nullable), term_id (nullable), subject_id (nullable), quiz_type (lesson_mc/lesson_mc_tf/lesson_short/lesson_reflection/topic_test/term_exam), order, tier_config (JSON)

**`quiz_questions`**
- id, quiz_id, type (multiple_choice/true_false/short_answer/free_form), question_text, options (JSON), correct_answer, explanation, points

**`subscriptions`**
- id, student_id, plan_type (subject/term/form), subject_id, form_id, term_id, billing_type (monthly/one_time), status (active/cancelled/expired), starts_at, expires_at, price_paid

**`student_profiles`**
- id, user_id, display_name, avatar_url, learning_tier (guided/balanced/exam_ready), personality_answers (JSON), onboarding_complete, xp_total, current_level, current_streak

**`student_progress`**
- id, student_id, lesson_id, section_id, completed_at

**`quiz_attempts`**
- id, student_id, quiz_id, tier, score, max_score, passed, answers (JSON), feedback (JSON), started_at, completed_at, attempt_number

**`achievements`**
- id, name, description, icon, criteria_type, criteria_value

**`student_achievements`**
- id, student_id, achievement_id, earned_at

**`streaks`**
- id, student_id, date, activity_count

### Tables to remove (old model)

- `lessons` (replaced by new structure)
- `lesson_purchases` (replaced by subscriptions)
- `tutors`
- `bookings`
- `reviews`
- `topic_requests` / `topic_request_responses`
- `payout_requests`
- `verifications`

### Tables to keep

- `profiles` — base user profile (role: student/admin)
- `pending_transactions` — for mobile money payment flow

## 7. Navigation & Content Flow

### Main navigation

- Dashboard (home)
- Subjects (browse content)
- Leaderboard
- Settings

### Content drill-down

```
Pick a form (Form 1, 2, 3, 4)
  → Pick a term (Term 1, 2, 3)
    → See all subjects for that form/term
      → Pick a subject → See units (unlock sequentially)
        → Pick a unit → See topics (any order within unit)
          → Pick a topic → See lessons in order
            → Start lesson
```

### Inside a lesson (linear flow)

1. Video 1 (intro) — FREE
2. --- Paywall if not subscribed ---
3. Slides Section 1
4. Quiz 1 (10 MC)
5. Video 2
6. Slides Section 2
7. Quiz 2 (10 MC + T/F)
8. Video 3
9. Slides Section 3
10. Quiz 3 (10 short answer)
11. Video 4 (closing)
12. Quiz 4 (reflection)
13. Lesson complete — XP awarded, progress updated

### Locked content indicators

- Units not yet unlocked: greyed out with lock icon, contents visible but not accessible
- Lessons without content: "Coming soon" badge, not clickable
- Content behind paywall: intro video plays, then subscription prompt

## 8. Student Dashboard

### Layout (hybrid)

**Top section — Progress:**
- Current subjects with progress rings (% complete)
- "Continue learning" button — next incomplete lesson
- Streak counter
- Current level and XP bar to next level

**Bottom section — Activity:**
- Recent activity feed
- Recent achievements/badges
- Leaderboard preview (your rank this week)

## 9. Gamification (Phase 1 — Medium)

### XP System

| Action | XP |
|--------|-----|
| Complete a lesson section (video/slides) | +10 |
| Pass a lesson quiz | +25 |
| Pass a topic test | +100 |
| Pass a term exam | +500 |
| Bonus: first attempt pass | +10 |
| Bonus: perfect score | +25 |
| Bonus: streak milestone | +50 |

### Levels

XP thresholds define levels (Level 1: 0, Level 2: 100, Level 3: 300, etc.). Displayed on dashboard and leaderboard.

### Streaks

- 1 streak = at least 1 lesson section or quiz completed per day
- Visible on dashboard
- Milestones earn badges (7, 30, 100 days)

### Leaderboards

- Weekly and monthly rankings by XP earned
- Scoped per form level
- Top 3 highlighted

### Badges

- Topic completion ("Algebra Master")
- Term completion ("Form 1 Term 1 Complete")
- Streak milestones (7, 30, 100 days)
- Perfect quiz scores ("Flawless")
- First lesson completed ("Getting Started")

### Phase 2 (future — full native app)

- Unlockable rewards (avatars, titles)
- Challenge modes (quiz battles)
- Push notifications for engagement nudges

## 10. Admin & Content Management

### Admin capabilities

**Content management:**
- Create/edit subjects, units, topics, lessons
- Upload videos (Cloudflare Stream ID) and slides per lesson section
- Create/edit quiz questions for all quiz types
- Set lesson status (draft/published/coming_soon)
- Bulk import quiz questions

**Student management:**
- View students, subscriptions, progress, quiz scores
- Manually activate/deactivate subscriptions
- View payment history

**Analytics dashboard:**
- Active subscribers by plan type
- Revenue breakdown
- Popular/unpopular subjects
- Average quiz scores by subject/form/tier
- Retention and churn
- Completion rates

**Content status overview:**
- Which subjects/forms/terms have published content vs coming soon
- Content coverage gaps

### Access

- Admin routes protected by role check (role: admin in profiles table)
- Existing middleware pattern extended for admin

## 11. Technical Approach

- **Evolve existing codebase** — keep Next.js 14 + Supabase + Tailwind
- **Keep**: Auth system, MoneyUnify payment integration, middleware pattern, theming
- **Remove**: Tutor features (archived in `archive/tutor-marketplace/`)
- **Rebuild**: Database schema, all page routes, dashboard, content browsing
- **Backend-first**: Focus on working backend with functional UI. UI polish comes later.
- **Video hosting**: Cloudflare Stream (existing)
- **Slides**: Stored as JSON in Supabase, rendered client-side

---

*Last updated: 2026-04-14*
