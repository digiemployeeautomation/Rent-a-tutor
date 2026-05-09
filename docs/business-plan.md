# Rent a Tutor — Business Plan

## Platform Overview

Rent a Tutor is a self-serve learning platform for Zambian students (O-Level and A-Level) aligned with the Zambia Education Curriculum. The platform provides structured, engaging lessons through slides and videos, with quizzes and exams to track progress and prepare students for exams.

## Business Model

### Revenue: Subscription-Based Access

Students subscribe to access content at three levels:

| Plan | Scope | Duration | Billing |
|------|-------|----------|---------|
| **Per Subject** | 1 subject, 1 term, 1 form | 1 month | Monthly recurring OR one-time |
| **Per Term** | All subjects, 1 term, 1 form | 4 months | Monthly recurring OR one-time |
| **Per Form** | All subjects, all terms, 1 form | 12 months | Monthly recurring OR one-time |

- **Monthly recurring**: Per Subject pays monthly (cancel anytime). Per Term pays monthly for up to 4 months. Per Form pays monthly for up to 12 months.
- **One-time purchase**: Pay once for the full duration at a discount vs monthly.

### Pricing (TBD)
- Per Subject: TBD ZMW/month
- Per Term: TBD ZMW/month
- Per Form: TBD ZMW/month
- Discounts for duration-based purchases: TBD%

### Payment Methods
- Airtel Money
- MTN MoMo
- Zamtel Kwacha

## V1 PoC Scope (decided 2026-05-09)

- **Subject**: Mathematics only
- **Form**: Form 1 only (all 3 terms)
- **Format**: Slides only — no video, no AI runtime, no Voice/interest variants
- **Personalization**: Three pedagogical tracks (Learner / Reviser / Exam-prep) selected per topic; topic-weighted + adaptive + track-aware tests and exams
- **Onboarding**: 10 global + 4 per-subject + 1 per-topic micro-intake
- **Detailed design**: see `docs/superpowers/specs/2026-05-09-form-1-math-personalization-design.md`

V2 expands to other Form 1 subjects, then to Forms 2–4. Video and AI-generated content unlocked when budget allows.

## Content Strategy

### Content Structure (V1 — slides only, video deferred)
```
Subject (e.g., Mathematics)
  └── Form Level (e.g., Form 1)
       └── Term (e.g., Term 1)
            └── Topic (e.g., Algebraic Expressions)
                 └── Lesson (e.g., "Simplifying Expressions")
                      └── Block pool, tagged: foundational │ core-full │
                          core-summary │ worked-easy/medium/hard │
                          practice │ common-mistakes │ recap

                          The student's track (Learner / Reviser /
                          Exam-prep) selects which blocks render.
                          All tracks cover the full curriculum.
```

V2+ adds video blocks back into the same pool when production budget allows.

### Assessments
- **Lesson Quizzes**: 4 quizzes per lesson (MC → MC+T/F → Short answer → Reflection)
- **Topic Test**: After completing all lessons in a topic
- **Term Exam**: After completing all topics in a term

### Content Production
- All content produced in-house (not by external tutors)
- Slides and videos created by the platform owner
- Curriculum-aligned to Zambia Ministry of Education syllabi

## Target Market

- **Primary**: Zambian O-Level students (Form 1-4)
- **Secondary**: A-Level students (Form 5-6)
- **Payers**: Students and/or their parents

## Engagement & Retention

### Personalized Learning Tiers (assigned per topic via three-stage onboarding)

V1 onboarding: 10 global questions at signup + 4 questions before each subject's first lesson + 1 micro-question before each topic's first lesson. The most-specific answer wins, so a student can be Reviser overall but Learner for one weak topic.

The tier now drives both **assessment behavior** (the table below) and **slide-block selection** for each lesson — Learners see the full build-up, Revisers see a condensed pass, Exam-prep students see mastery and past-paper-style content. All tracks cover the full curriculum.



| Feature | Guided (Relaxed) | Balanced (Recommended) | Exam Ready (Strict) |
|---------|-------------------|------------------------|---------------------|
| Pass threshold | Can proceed regardless | 60%+ to proceed | 80%+ to proceed |
| Wrong answer feedback | Immediate | After submission | After passing only |
| Quiz retries | Unlimited | Up to 3, then unlocks | Unlimited, full reset |
| Progress focus | Completion | Completion + scores | Scores + weak areas |

### Assessment Tiers

**Topic Tests:**
| Feature | Guided | Balanced | Exam Ready |
|---------|--------|----------|------------|
| Questions | 20 | 30 | 40 |
| Time limit | None | 45 min | 30 min |
| Pass mark | 50% | 60% | 75% |
| Retries | Unlimited | Up to 3 | Unlimited, full reset |

**Term Exams:**
| Feature | Guided | Balanced | Exam Ready |
|---------|--------|----------|------------|
| Questions | 40 | 60 | 80 |
| Time limit | None | 90 min | 60 min |
| Pass mark | 50% | 60% | 75% |
| Format | By topic | Exam-paper sections | ECZ exam format |
| Retries | Unlimited | Up to 2 | Unlimited, full reset |

All term exams pull questions adaptively — heavier weighting on topics where the student scored lower.

### Gamification (Phase 1 — Medium)
- Progress bars per subject/term/form
- Daily login streaks
- Completion badges per topic and term
- XP points for completing lessons, quizzes, and exams
- Leaderboards (weekly/monthly)
- Level-up system

### Gamification (Phase 2 — Full App)
- Unlockable rewards (avatars, titles)
- Challenge modes (quiz battles)
- Push notifications for engagement nudges

## Competitive Positioning

- **vs. private tutors**: More affordable, available 24/7, curriculum-aligned
- **vs. YouTube**: Structured learning path with assessments, not random videos
- **vs. Alison/Coursera**: Specifically built for Zambian curriculum (ECZ), local payment methods

## Key Metrics (to track)
- Monthly active students
- Subscription conversion rate (free → paid)
- Lesson completion rate
- Quiz pass rates by tier
- Retention (monthly churn rate)
- Revenue per student

---
*Last updated: 2026-05-09*
