# Rent a Tutor — UI Redesign Spec

## Overview

Redesign the entire platform UI for high school students (14-18 year olds in Zambia). The platform should feel clean, modern, and interactive — like a polished mobile app. Feed-style scrolling is the primary interaction pattern. Subtle animations keep it alive without distracting from learning.

**Target audience:** Zambian high school students on phones and laptops.
**Vibe:** Clean & modern with personality. Not childish, not corporate.
**Inspiration:** Notion/Linear aesthetics meets Duolingo engagement.

---

## 1. Design System

### Color Palette

| Role | Color | Usage |
|------|-------|-------|
| Primary Blue | #3B82F6 range | Navigation, headers, primary buttons, links |
| White | #FFFFFF | Backgrounds, cards, clean space |
| Soft Pink | #F472B6 range | Accents — XP badges, streak highlights, hover states, progress, active states |
| Gray scale | #F9FAFB → #111827 | Borders, muted text, disabled states, subtle backgrounds |
| Success Green | #22C55E | Correct answers, completion states |
| Error Red | #EF4444 | Wrong answers, errors |
| Warning Amber | #F59E0B | Warnings, "areas to revisit" |

### Typography

- **Font family:** Inter (or system sans-serif fallback)
- **No serif fonts** — clean modern feel throughout
- **Base size:** 16px (larger for mobile readability)
- **Headings:** Bold weight, slightly larger
- **Body:** Regular weight
- **Secondary text:** Muted gray, smaller

### Shapes & Spacing

- **Border radius:** 12-16px on cards, 8px on buttons, full round on pills/badges
- **Generous whitespace:** Breathable layout, not cramped
- **Cards:** Subtle shadow (soft elevation), no hard borders, white background
- **Spacing scale:** 4px base unit (4, 8, 12, 16, 24, 32, 48)

### Animations

- **Scroll reveal:** Elements fade in + slight slide up as they enter viewport
- **Page transitions:** Crossfade between routes
- **Button hover:** Subtle scale (1.02) + shadow lift
- **Progress bars:** Smooth fill animation (ease-out, ~600ms)
- **Number counters:** Count-up animation for XP, scores
- **Card entrance:** Staggered fade-in when multiple cards load

All animations are subtle — smooth and polished, not bouncy or flashy.

---

## 2. Layout & Navigation

### Mobile (primary)

- **Top bar:** Logo (left) + profile avatar (right). Clean, minimal.
- **Bottom tab bar:** 4 tabs with icons + labels:
  - Home (feed icon)
  - Learn (book icon)
  - Leaderboard (trophy icon)
  - Profile (user icon)
- **Feed-style scrolling:** Vertical card feed is the primary interaction
- **Lesson player:** Full-screen takeover — no tabs, no nav. Just back arrow + progress bar.

### Desktop

- **Same feed-style:** Centered content column (max-width ~640px), white space on sides
- **Top navigation bar:** Logo left, nav links center (Home, Learn, Leaderboard), profile right
- **No sidebar:** Keeps the feed feel consistent with mobile
- **Lesson player:** Same full-screen immersive, slightly wider content area

---

## 3. Home Feed

The home screen is a vertically scrolling feed of cards. Each card type has a distinct visual identity.

### Card types (priority order)

1. **Continue Learning** — Always at top. Current lesson title, subject, progress bar, pink "Continue" button. Slightly larger than other cards.

2. **Streak** — Flame icon + day count. Pink glow when active, grey when 0. "Keep it going!" message. Compact.

3. **Daily XP Summary** — "You earned 150 XP today" with animated count-up. Level progress bar showing distance to next level.

4. **Quiz Result** — Appears after quiz. "You scored 80% on Algebra Quiz 2". Green check or red retry icon. Tappable to review.

5. **Achievement Unlocked** — Badge icon, name, description. Soft pink background. Appears on earn, then settles into feed.

6. **Subject Progress** — One per subscribed subject. Circular progress ring, subject name, "X lessons completed". Tappable to jump into subject.

7. **Leaderboard Snippet** — "You're #5 this week" with top 3 names. "View full leaderboard" link. Compact.

8. **Personalization Nudge** — Only if onboarding incomplete. "Complete your profile for a personalized experience". Dismissible.

Cards have staggered fade + slide-up entrance animations on scroll.

---

## 4. Lesson Player (Full-Screen Immersive)

### Layout

- **Top bar:** Back arrow (left), lesson title (center truncated), progress dots/bar (full width below top bar)
- **Content area:** Full screen, centered, scrollable within section
- **Bottom bar:** "Continue" / "Next" button pinned at bottom — big, tappable, blue primary

### Video sections

- Video player fills width, 16:9 ratio
- Lesson title above
- Continue button enables after a few seconds (encourages watching, doesn't force)

### Slide sections

- Single slide fills content area
- Large text, clean layout (title, body, bullets, image)
- Swipe left/right or tap arrows to navigate
- Dots at bottom (Instagram stories style)
- "Done with slides" button on last slide

### Quiz sections — 3 modes mapped to tier + quiz type

| | Quiz 1 (MC) | Quiz 2 (MC+T/F) | Quiz 3 (Short) | Quiz 4 (Reflection) |
|---|---|---|---|---|
| **Guided** | One-at-a-time | One-at-a-time | Scrollable list | Scrollable list |
| **Balanced** | One-at-a-time | Card stack | Scrollable list | Scrollable list |
| **Exam Ready** | Card stack | Card stack | Scrollable list | Scrollable list |

**Topic tests and term exams:** Always scrollable list (longer format, exam simulation).

#### One-at-a-time mode

- Big question text centered
- 4 large answer buttons stacked vertically, full width, rounded
- Tap to select → button highlights pink → auto-advance after 0.5s
- Progress dots at top
- Correct: button flashes green + checkmark
- Wrong: button flashes red (explanations per tier rules)

#### Card stack mode

- Question card in center with slight 3D perspective
- Answer buttons below
- On answer: card slides away left, next card slides in from right
- No going back — faster paced
- Counter: "3/10"

#### Scrollable list mode

- All questions visible in scrollable list
- Each question is a card with answer options or text input
- Submit button at bottom
- Results appear inline after submission

#### Reflection (Quiz 4)

- Prompt at top
- Large textarea, full width
- Submit button
- Results: green panel for "What you covered", amber panel for "What you missed"

### Lesson complete screen

- Centered: "Lesson Complete!"
- XP earned (animated count-up)
- Score summary per quiz
- "Next Lesson" button (pink accent) or "Back to Topic" link

---

## 5. Learn Section (Content Browsing)

Each level of the drill-down feels like scrolling deeper, not navigating to separate pages.

### Form selection

- 4 large cards in 2x2 grid
- Form number (big), "O-Level" label
- Blue gradient background, white text

### Term selection

- 3 horizontal cards (swipeable row on mobile, side by side on desktop)
- Subtle color variation (light to darker blue)

### Subject grid

- 2-column grid of cards
- Each: subject icon, name, lesson count
- Subscribed: full color. Locked: muted + small lock icon
- Tapping locked subject → paywall slides up as bottom sheet

### Units + Topics

- Vertical feed of unit cards
- Expandable: tap unit to show topics inside
- Topics show: title, lesson count, status pill (Not started / In progress / Completed)
- Locked units: greyed with lock, contents visible but not accessible

### Paywall (bottom sheet)

- Slides up from bottom (not separate page)
- 3 plan cards
- Monthly/One-time toggle
- Payment flow stays in the sheet
- Dismiss by swiping down

---

## 6. Gamification UI

### XP & Levels

- XP counter in top bar / profile — small pill
- When earned: floating "+25 XP" animation rises from trigger (pink text, fades)
- Level-up: brief full-screen overlay — "Level 5!" with subtle burst, auto-dismiss 2 seconds

### Streaks

- Flame icon in home feed and profile
- Active: pink/orange glow, pulse animation
- Broken (0 days): grey, static
- Milestones (7, 30, 100): special badge in feed

### Leaderboard

- Full-screen ranked list
- Top 3: larger cards with gold/silver/bronze accents
- Current student: pink highlight, "You" badge
- Weekly/Monthly pill toggle at top
- Scoped to form level

### Achievements

- Profile badge grid (earned in color, unearned grey with "?")
- When earned: card slides into home feed
- Circular icon, name, description
- Tappable for detail

### Progress visualization

- Per-subject: circular ring (blue fill, pink when >80%)
- Per-topic: horizontal progress bar
- Per-lesson: dot progress in player
- Overall: "X% of Form 1 complete" in profile

---

## 7. Onboarding UI

### Flow (full-screen, no navigation)

- Step indicator: dots at top (not numbered)
- **Welcome:** Friendly heading, 4 big tappable cards for question count (Quick 5 / Standard 10 / Full 15 / Skip). Each shows time estimate.
- **Personality quiz:** One-at-a-time mode. Big text, 3 option buttons. Progress bar fills. Smooth slide transitions.
- **Tier recommendation:** 3 tier cards (swipeable on mobile). Recommended pre-selected with pink badge.
- **Subject interests:** Grid of tappable pills/chips. Blue fill when selected.
- **Done:** "You're all set!" + "Start learning" button.

### Settings page

Feed-style scrollable sections:
- **Profile:** Avatar, name, form level card
- **Learning tier:** 3 cards, current highlighted, tap to switch
- **Personalization:** Questions as expandable cards. Answered shows selection. Unanswered has pink dot + "Tap to answer". Completion progress bar.
- **Subjects:** Same chip grid as onboarding
- **Subscription:** Current plan card with expiry. "Manage" link.

---

## 8. Technical Approach

- Replace current forest/gold CSS variables with new blue/white/pink palette
- Replace Georgia serif with Inter (or system sans-serif)
- Add Framer Motion (or CSS animations) for scroll reveal, page transitions, micro-interactions
- Bottom tab bar component for mobile (hide on desktop)
- Feed card component system — each card type is a reusable component
- Quiz player refactor — 3 rendering modes (one-at-a-time, card-stack, scrollable-list) selected by tier+quiz_type
- Paywall refactored to bottom sheet (modal that slides up)
- Lesson player wrapped in a full-screen layout (hides nav)
- Mobile-first responsive — design for 375px first, scale up

---

*Last updated: 2026-04-14*
