# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the platform UI from a corporate forest-green tutoring marketplace to a clean, modern, blue/white/pink feed-style learning app for high school students.

**Architecture:** Replace the CSS variable palette and Tailwind config, add Inter font, add animation utilities, restructure layout to feed-style with bottom tabs on mobile. Refactor all page components to use the new design system. Add 3 quiz rendering modes. All changes are frontend-only — no database or API changes.

**Tech Stack:** Next.js 14, Tailwind CSS, CSS custom properties, CSS animations (no new dependencies — avoid Framer Motion to keep bundle small, use CSS transitions and keyframes instead)

**Spec:** `docs/superpowers/specs/2026-04-14-ui-redesign-design.md`

---

## Plan Overview (6 phases)

| Phase | Name | Tasks | Depends On |
|-------|------|-------|------------|
| A | Design System + Layout | 5 | — |
| B | Home Feed | 3 | Phase A |
| C | Lesson Player UI | 4 | Phase A |
| D | Learn Section UI | 3 | Phase A |
| E | Gamification UI | 3 | Phase A, B |
| F | Onboarding + Settings UI | 3 | Phase A |

---

## File Structure

### Files to create

```
components/
  layout/
    BottomTabs.js           — Mobile bottom tab navigation
    FeedLayout.js           — Centered feed column wrapper
    TopBar.js               — Minimal top bar (logo + avatar)
    FullScreenLayout.js     — Lesson player wrapper (hides nav)
  feed/
    FeedCard.js             — Base card component with animations
    ContinueLearningCard.js — Continue lesson CTA card
    StreakCard.js            — Streak status card
    XPSummaryCard.js        — Daily XP summary card
    QuizResultCard.js       — Quiz result card
    AchievementCard.js      — Achievement unlocked card
    SubjectProgressCard.js  — Subject progress ring card
    LeaderboardSnippetCard.js — Mini leaderboard card
    NudgeCard.js            — Personalization nudge card
  lesson/
    QuizOneAtATime.js       — One question at a time quiz mode
    QuizCardStack.js        — Card stack quiz mode
    QuizScrollableList.js   — Scrollable list quiz mode
  ui/
    ScrollReveal.js         — Scroll-triggered fade-in wrapper
    CountUp.js              — Animated number counter
    FloatingXP.js           — "+25 XP" floating animation
    LevelUpOverlay.js       — Level-up celebration overlay
    BottomSheet.js          — Bottom sheet modal (for paywall)
```

### Files to modify

```
app/globals.css                        — Replace color palette, add animations
tailwind.config.js                     — New colors, Inter font, animation utilities
app/layout.js                          — Remove tutor theme, add Inter font import
components/layout/Navbar.js            — Restyle for blue/white, desktop only
components/layout/AppShell.js          — Add BottomTabs on mobile, hide Navbar
app/page.js                            — Restyle homepage
app/dashboard/student/page.js          — Rewrite as feed
components/dashboard/ProgressRings.js  — Blue/pink colors
components/dashboard/StreakCounter.js   — Pink glow
components/dashboard/XPBar.js          — Blue/pink bar
components/dashboard/ActivityFeed.js   — Card-based
components/dashboard/LeaderboardPreview.js — Pink highlight
components/lesson/QuizPlayer.js        — Route to 3 quiz modes
components/lesson/VideoPlayer.js       — Clean styling
components/lesson/SlideViewer.js       — Stories-style dots
components/lesson/LessonProgress.js    — Dot progress with icons
components/lesson/Paywall.js           — Bottom sheet style
app/learn/page.js                      — Blue gradient cards
app/learn/[formId]/page.js             — Swipeable term cards
app/learn/[formId]/[termId]/page.js    — Subject grid restyle
app/learn/[formId]/[termId]/[subjectSlug]/page.js — Feed-style units
app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/page.js — Card-style lessons
app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/lesson/[lessonId]/page.js — Full-screen layout
app/dashboard/student/leaderboard/page.js — Pink highlights, medals
app/dashboard/student/settings/page.js — Feed-style sections
app/onboarding/page.js                — Dot steps, card-based
app/onboarding/layout.js              — Clean minimal
components/onboarding/PersonalityQuiz.js — One-at-a-time style
components/onboarding/TierRecommendation.js — Card selection
app/auth/login/page.js                — Blue/white restyle
app/auth/register/page.js             — Blue/white restyle
```

---

## Phase A: Design System + Layout

### Task A1: Replace color palette and typography

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.js`
- Modify: `app/layout.js`

- [ ] **Step 1: Replace CSS variables in globals.css**

Replace the entire `:root, [data-theme="student"]` block and remove `[data-theme="tutor"]` block. Replace with:

```css
:root {
  /* Primary Blue */
  --color-primary:          #2563EB;
  --color-primary-mid:      #3B82F6;
  --color-primary-lit:      #60A5FA;
  --color-primary-dark:     #1D4ED8;

  /* Soft Pink accent */
  --color-accent:           #EC4899;
  --color-accent-mid:       #F472B6;
  --color-accent-lit:       #FBCFE8;

  /* Surfaces */
  --color-surface:          #F9FAFB;
  --color-surface-mid:      #F3F4F6;
  --color-highlight:        #FDF2F8;
  --color-page-bg:          #FFFFFF;

  /* Navigation */
  --color-nav-bg:           #FFFFFF;
  --color-nav-text:         #1F2937;
  --color-nav-accent:       #2563EB;

  /* Badges */
  --color-badge-bg:         #EFF6FF;
  --color-badge-text:       #1D4ED8;

  /* Buttons */
  --color-btn-bg:           #2563EB;
  --color-btn-text:         #FFFFFF;
  --color-btn-hover:        #1D4ED8;
  --color-accent-btn:       #EC4899;
  --color-accent-btn-text:  #FFFFFF;

  /* Progress */
  --color-progress:         #3B82F6;

  /* Stats */
  --color-stat-a-bg:        #EFF6FF;
  --color-stat-a-text:      #1E40AF;
  --color-stat-a-sub:       #3B82F6;
  --color-stat-b-bg:        #FDF2F8;
  --color-stat-b-text:      #9D174D;
  --color-stat-b-sub:       #EC4899;

  /* Shadows */
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm:  0 2px 6px rgba(0,0,0,0.06);
  --shadow-md:  0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.10);
  --shadow-xl:  0 16px 48px rgba(0,0,0,0.14);

  /* Shimmer */
  --shimmer-from: #F3F4F6;
  --shimmer-via:  #F9FAFB;
  --shimmer-to:   #F3F4F6;
  --color-body-text: #111827;

  /* shadcn tokens */
  --background:         #FFFFFF;
  --foreground:         #111827;
  --muted:              #F3F4F6;
  --muted-foreground:   #6B7280;
  --accent:             #FDF2F8;
  --accent-foreground:  #EC4899;
  --border:             #E5E7EB;
  --ring:               #3B82F6;
  --destructive:        #EF4444;
  --destructive-foreground: #FFFFFF;
  --primary:            #2563EB;
  --primary-foreground: #FFFFFF;
  --secondary:          #F3F4F6;
  --secondary-foreground: #1F2937;
  --popover:            #FFFFFF;
  --popover-foreground: #111827;
  --input:              #E5E7EB;

  /* Semantic */
  --color-success:      #22C55E;
  --color-error:        #EF4444;
  --color-warning:      #F59E0B;

  /* Toast */
  --toast-success-bg: #F0FDF4;
  --toast-success-border: #BBF7D0;
  --toast-success-text: #166534;
  --toast-error-bg: #FEF2F2;
  --toast-error-border: #FECACA;
  --toast-error-text: #991B1B;
  --toast-info-bg: #EFF6FF;
  --toast-info-border: #BFDBFE;
  --toast-info-text: #1E40AF;
}
```

- [ ] **Step 2: Add animation keyframes to globals.css**

Append to the end of globals.css:

```css
/* ── Animations ── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideOutLeft {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-20px); }
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-40px); }
}

@keyframes pulse-pink {
  0%, 100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(236, 72, 153, 0); }
}

@keyframes progressFill {
  from { width: 0%; }
}

@keyframes levelUp {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}

.animate-fade-in-up { animation: fadeInUp 0.4s ease-out both; }
.animate-fade-in { animation: fadeIn 0.3s ease-out both; }
.animate-slide-in-right { animation: slideInRight 0.3s ease-out both; }
.animate-slide-out-left { animation: slideOutLeft 0.3s ease-out both; }
.animate-float-up { animation: floatUp 1s ease-out both; }
.animate-pulse-pink { animation: pulse-pink 2s ease-in-out infinite; }
.animate-level-up { animation: levelUp 0.5s ease-out both; }

/* Staggered children */
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 60ms; }
.stagger-children > *:nth-child(3) { animation-delay: 120ms; }
.stagger-children > *:nth-child(4) { animation-delay: 180ms; }
.stagger-children > *:nth-child(5) { animation-delay: 240ms; }
.stagger-children > *:nth-child(6) { animation-delay: 300ms; }
.stagger-children > *:nth-child(7) { animation-delay: 360ms; }
.stagger-children > *:nth-child(8) { animation-delay: 420ms; }
```

- [ ] **Step 3: Update tailwind.config.js**

Replace the colors and font config:

```js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        border: 'var(--border)',
        ring: 'var(--ring)',
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        input: 'var(--input)',
        blue: {
          50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
          400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
          800: '#1E40AF', 900: '#1E3A8A',
        },
        pink: {
          50: '#FDF2F8', 100: '#FCE7F3', 200: '#FBCFE8', 300: '#F9A8D4',
          400: '#F472B6', 500: '#EC4899', 600: '#DB2777', 700: '#BE185D',
          800: '#9D174D', 900: '#831843',
        },
      },
      borderColor: { DEFAULT: 'var(--border)' },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out both',
        'fade-in': 'fadeIn 0.3s ease-out both',
        'slide-in-right': 'slideInRight 0.3s ease-out both',
        'float-up': 'floatUp 1s ease-out both',
        'pulse-pink': 'pulse-pink 2s ease-in-out infinite',
        'level-up': 'levelUp 0.5s ease-out both',
        'progress-fill': 'progressFill 0.6s ease-out both',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Update app/layout.js**

Remove tutor theme logic, add Inter font import, simplify to single theme:

```js
import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/ui/toast'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Rent a Tutor',
  description: "Zambia's online learning platform for O-Level students",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-white text-gray-900">
        <ThemeProvider>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tailwind.config.js app/layout.js
git commit -m "feat: replace design system — blue/white/pink palette, Inter font, animations"
```

### Task A2: Create layout components (TopBar, BottomTabs, FeedLayout, FullScreenLayout)

**Files:**
- Create: `components/layout/TopBar.js`
- Create: `components/layout/BottomTabs.js`
- Create: `components/layout/FeedLayout.js`
- Create: `components/layout/FullScreenLayout.js`

- [ ] **Step 1: Create TopBar**

Minimal top bar — logo left, profile avatar right. Used on all non-lesson pages.

```js
// components/layout/TopBar.js
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TopBar() {
  const [avatar, setAvatar] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAvatar(user.user_metadata?.avatar_url)
    })
  }, [])

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <Link href="/dashboard/student" className="text-xl font-bold text-blue-600">
        Rent<span className="text-pink-400">a</span>Tutor
      </Link>
      <Link href="/dashboard/student/settings" className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold overflow-hidden">
        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : '?'}
      </Link>
    </header>
  )
}
```

- [ ] **Step 2: Create BottomTabs**

Mobile bottom navigation — 4 tabs: Home, Learn, Leaderboard, Profile. Hidden on desktop.

```js
// components/layout/BottomTabs.js
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard/student', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { href: '/learn', label: 'Learn', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '/dashboard/student/leaderboard', label: 'Rank', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { href: '/dashboard/student/settings', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

export default function BottomTabs() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {TABS.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard/student' && pathname.startsWith(tab.href))
          return (
            <Link key={tab.href} href={tab.href} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className={`text-[10px] font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Create FeedLayout**

Centered content column for feed pages.

```js
// components/layout/FeedLayout.js
export default function FeedLayout({ children, className = '' }) {
  return (
    <div className={`mx-auto max-w-xl px-4 pb-24 md:pb-8 ${className}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Create FullScreenLayout**

Wrapper for lesson player that hides all navigation.

```js
// components/layout/FullScreenLayout.js
'use client'
import { useRouter } from 'next/navigation'

export default function FullScreenLayout({ title, progress, children }) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-4 py-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-1 text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="flex-1 text-center text-sm font-medium text-gray-700 truncate px-4">{title}</span>
        <div className="w-6" /> {/* Spacer for centering */}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-blue-500 transition-all duration-600 ease-out" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/TopBar.js components/layout/BottomTabs.js components/layout/FeedLayout.js components/layout/FullScreenLayout.js
git commit -m "feat: add new layout components — TopBar, BottomTabs, FeedLayout, FullScreenLayout"
```

### Task A3: Create UI utility components

**Files:**
- Create: `components/ui/ScrollReveal.js`
- Create: `components/ui/CountUp.js`
- Create: `components/ui/FloatingXP.js`
- Create: `components/ui/LevelUpOverlay.js`
- Create: `components/ui/BottomSheet.js`

- [ ] **Step 1: Create ScrollReveal**

Wrapper that fades in children when they enter the viewport.

```js
// components/ui/ScrollReveal.js
'use client'
import { useEffect, useRef, useState } from 'react'

export default function ScrollReveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create CountUp**

Animated number that counts up from 0 to target.

```js
// components/ui/CountUp.js
'use client'
import { useEffect, useState } from 'react'

export default function CountUp({ target, duration = 800, className = '' }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target === 0) return
    const steps = 30
    const increment = target / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setValue(target); clearInterval(timer) }
      else setValue(Math.floor(current))
    }, interval)
    return () => clearInterval(timer)
  }, [target, duration])

  return <span className={className}>{value.toLocaleString()}</span>
}
```

- [ ] **Step 3: Create FloatingXP**

Floating "+25 XP" text that rises and fades.

```js
// components/ui/FloatingXP.js
'use client'
import { useEffect, useState } from 'react'

export default function FloatingXP({ amount, onDone }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => { setShow(false); onDone?.() }, 1000)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!show) return null

  return (
    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-pink-500 font-bold text-sm animate-float-up pointer-events-none">
      +{amount} XP
    </span>
  )
}
```

- [ ] **Step 4: Create LevelUpOverlay**

Brief full-screen overlay for level-up celebration.

```js
// components/ui/LevelUpOverlay.js
'use client'
import { useEffect, useState } from 'react'

export default function LevelUpOverlay({ level, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); onDone?.() }, 2000)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
      <div className="animate-level-up bg-white rounded-3xl p-10 text-center shadow-2xl">
        <div className="text-5xl mb-3">🎉</div>
        <div className="text-2xl font-bold text-blue-600">Level {level}!</div>
        <div className="text-gray-500 mt-1 text-sm">Keep going!</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create BottomSheet**

Modal that slides up from bottom. For paywall and other overlays.

```js
// components/ui/BottomSheet.js
'use client'
import { useEffect } from 'react'

export default function BottomSheet({ open, onClose, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-fade-in-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="px-5 pb-8">
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/ScrollReveal.js components/ui/CountUp.js components/ui/FloatingXP.js components/ui/LevelUpOverlay.js components/ui/BottomSheet.js
git commit -m "feat: add UI utility components — ScrollReveal, CountUp, FloatingXP, LevelUpOverlay, BottomSheet"
```

### Task A4: Update AppShell and Navbar for new layout

**Files:**
- Modify: `components/layout/AppShell.js`
- Modify: `components/layout/Navbar.js`

- [ ] **Step 1: Read current AppShell.js and Navbar.js**

Read both files to understand current structure before modifying.

- [ ] **Step 2: Update AppShell**

Integrate TopBar + BottomTabs. Hide both when on lesson player pages (path contains `/lesson/`). Show Navbar on desktop only, TopBar + BottomTabs on mobile.

The AppShell should:
- Detect if on a lesson player page (pathname includes `/lesson/`) — if so, render only children (lesson player provides its own FullScreenLayout)
- Detect if on admin pages — if so, render children only (admin has its own layout)
- Detect if on auth/onboarding pages — render children only
- Otherwise: render TopBar (mobile) + Navbar (desktop) + children + BottomTabs (mobile)

- [ ] **Step 3: Update Navbar**

Restyle for blue/white theme:
- White background, subtle bottom border
- Blue text for active links, gray for inactive
- Desktop only (hidden on mobile with `hidden md:flex`)
- Links: Home, Learn, Leaderboard, Settings
- Logo on left, nav center, profile on right

- [ ] **Step 4: Commit**

```bash
git add components/layout/AppShell.js components/layout/Navbar.js
git commit -m "feat: update AppShell and Navbar for feed-style layout with bottom tabs"
```

### Task A5: Restyle auth pages (login + register)

**Files:**
- Modify: `app/auth/login/page.js`
- Modify: `app/auth/register/page.js`

- [ ] **Step 1: Read both auth pages**

- [ ] **Step 2: Restyle login page**

Replace forest-green references with blue:
- `forest-500` / `forest-600` / `forest-700` → `blue-500` / `blue-600` / `blue-700`
- `gold-500` → `pink-400`
- `sage-200` → white
- Update logo to match TopBar style: "Rent**a**Tutor" with pink 'a'
- White card with rounded-2xl, subtle shadow
- Blue primary button
- Clean, minimal

- [ ] **Step 3: Restyle register page**

Same color replacements. Update any CSS variable references (`var(--color-primary)`, `var(--color-btn-bg)`) — these now map to blue automatically but verify the result looks right.

- [ ] **Step 4: Commit**

```bash
git add app/auth/login/page.js app/auth/register/page.js
git commit -m "feat: restyle auth pages with blue/white/pink theme"
```

---

## Phase B: Home Feed

### Task B1: Create feed card components

**Files:**
- Create: `components/feed/FeedCard.js`
- Create: `components/feed/ContinueLearningCard.js`
- Create: `components/feed/StreakCard.js`
- Create: `components/feed/XPSummaryCard.js`
- Create: `components/feed/QuizResultCard.js`
- Create: `components/feed/AchievementCard.js`
- Create: `components/feed/SubjectProgressCard.js`
- Create: `components/feed/LeaderboardSnippetCard.js`
- Create: `components/feed/NudgeCard.js`

- [ ] **Step 1: Create FeedCard base**

Base card wrapper used by all feed cards. White background, rounded-2xl, soft shadow, hover scale effect.

```js
// components/feed/FeedCard.js
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function FeedCard({ children, className = '', delay = 0, onClick }) {
  return (
    <ScrollReveal delay={delay}>
      <div
        onClick={onClick}
        className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-transform duration-200 hover:scale-[1.01] ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {children}
      </div>
    </ScrollReveal>
  )
}
```

- [ ] **Step 2: Create all 8 card components**

Each card is a 'use client' component that renders inside a FeedCard. Follow the spec:

- **ContinueLearningCard** — Props: { lessonTitle, subjectName, progress, href }. Shows lesson title, subject badge, progress bar, pink "Continue" button. Largest card.
- **StreakCard** — Props: { days }. Flame icon + count. Pink glow when active. Compact.
- **XPSummaryCard** — Props: { xpToday, level, xpToNextLevel }. Uses CountUp for XP number. Level progress bar.
- **QuizResultCard** — Props: { quizName, score, passed, href }. Score, green check or red X. Tappable.
- **AchievementCard** — Props: { name, description, icon }. Pink-50 background. Badge display.
- **SubjectProgressCard** — Props: { name, slug, percentComplete, href }. SVG progress ring (blue, pink when >80%). Subject name.
- **LeaderboardSnippetCard** — Props: { rank, topThree }. Mini table, "View all" link.
- **NudgeCard** — Props: { onDismiss }. Personalization prompt. Dismissible with X button.

Each component should be its own file in `components/feed/`.

- [ ] **Step 3: Commit**

```bash
git add components/feed/
git commit -m "feat: add feed card components for home screen"
```

### Task B2: Rewrite student dashboard as feed

**Files:**
- Modify: `app/dashboard/student/page.js`

- [ ] **Step 1: Read current dashboard page**

- [ ] **Step 2: Rewrite as feed layout**

Replace the current dashboard with a FeedLayout containing cards in priority order:
1. ContinueLearningCard (if there's an in-progress lesson)
2. StreakCard + XPSummaryCard side by side (2-column grid)
3. SubjectProgressCards (for each subscribed subject)
4. Recent QuizResultCards (last 2-3)
5. LeaderboardSnippetCard
6. AchievementCard (most recent)
7. NudgeCard (if onboarding incomplete)

Use the existing data fetching logic but render with new feed components. Wrap in FeedLayout. Add `stagger-children` class to the container for staggered entrance.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/student/page.js
git commit -m "feat: rewrite student dashboard as card feed"
```

### Task B3: Update dashboard sub-components for new palette

**Files:**
- Modify: `components/dashboard/ProgressRings.js`
- Modify: `components/dashboard/StreakCounter.js`
- Modify: `components/dashboard/XPBar.js`
- Modify: `components/dashboard/ActivityFeed.js`
- Modify: `components/dashboard/LeaderboardPreview.js`

- [ ] **Step 1: Read all 5 files**

- [ ] **Step 2: Update color references**

In all files, replace:
- `forest-*` → `blue-*`
- `gold-*` → `pink-*`
- `sage-*` → `blue-*` or `gray-*`
- Any green progress → blue progress, pink when >80%
- Streak glow → pink pulse animation
- Leaderboard current user → pink background

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/
git commit -m "feat: update dashboard components for blue/white/pink palette"
```

---

## Phase C: Lesson Player UI

### Task C1: Create three quiz rendering modes

**Files:**
- Create: `components/lesson/QuizOneAtATime.js`
- Create: `components/lesson/QuizCardStack.js`
- Create: `components/lesson/QuizScrollableList.js`

- [ ] **Step 1: Create QuizOneAtATime**

Full-screen one-question-at-a-time mode. Props: { questions, onAnswer, onComplete, showExplanations }

- Big question text centered
- 4 large rounded answer buttons stacked vertically
- Tap → highlights pink → correct flashes green / wrong flashes red → auto-advance 0.5s
- Progress dots at top
- No going back

- [ ] **Step 2: Create QuizCardStack**

Card-stack mode. Props: { questions, onAnswer, onComplete, showExplanations }

- Question card with slight shadow/elevation
- Answer buttons below
- On answer: card slides left (animate-slide-out-left), next slides in (animate-slide-in-right)
- Counter: "3/10"
- No going back, faster paced

- [ ] **Step 3: Create QuizScrollableList**

All questions visible. Props: { questions, answers, onChange, onSubmit, results, showExplanations }

- Scrollable list of question cards
- Each card: question text, answer options or text input
- Submit button at bottom
- After submit: results appear inline (green/red borders, explanations)

- [ ] **Step 4: Commit**

```bash
git add components/lesson/QuizOneAtATime.js components/lesson/QuizCardStack.js components/lesson/QuizScrollableList.js
git commit -m "feat: add three quiz rendering modes — one-at-a-time, card-stack, scrollable-list"
```

### Task C2: Update QuizPlayer to route to modes by tier

**Files:**
- Modify: `components/lesson/QuizPlayer.js`

- [ ] **Step 1: Read current QuizPlayer**

- [ ] **Step 2: Add mode selection logic**

Import the three quiz mode components. Select which to render based on quiz_type + tier:

```
Guided:    quiz 1 → OneAtATime, quiz 2 → OneAtATime, quiz 3 → ScrollableList, quiz 4 → ScrollableList
Balanced:  quiz 1 → OneAtATime, quiz 2 → CardStack,  quiz 3 → ScrollableList, quiz 4 → ScrollableList
ExamReady: quiz 1 → CardStack,  quiz 2 → CardStack,  quiz 3 → ScrollableList, quiz 4 → ScrollableList
Topic tests / term exams → always ScrollableList
```

Add a `tier` prop to QuizPlayer. Map quiz_type + tier to the rendering mode component. The mode components handle their own answer collection and call back with results.

- [ ] **Step 3: Commit**

```bash
git add components/lesson/QuizPlayer.js
git commit -m "feat: route quiz rendering to mode based on tier and quiz type"
```

### Task C3: Restyle lesson player components

**Files:**
- Modify: `components/lesson/VideoPlayer.js`
- Modify: `components/lesson/SlideViewer.js`
- Modify: `components/lesson/LessonProgress.js`
- Modify: `components/lesson/Paywall.js`

- [ ] **Step 1: Read all 4 files**

- [ ] **Step 2: Restyle VideoPlayer**

Clean white background, rounded corners on the video container, blue play button overlay if needed.

- [ ] **Step 3: Restyle SlideViewer**

Instagram-stories style: dots at bottom (small circles, current = blue, done = filled blue, future = gray outline). Swipe-friendly. Clean white card for each slide.

- [ ] **Step 4: Restyle LessonProgress**

Dot progress bar: each dot is a circle with an icon inside (play for video, doc for slides, check for quiz). Current = blue ring, completed = green fill + checkmark, future = gray. Connected with thin lines.

- [ ] **Step 5: Restyle Paywall as BottomSheet**

Refactor Paywall to use BottomSheet component instead of full-page display. Slides up from bottom. Plan cards inside with blue/pink styling.

- [ ] **Step 6: Commit**

```bash
git add components/lesson/VideoPlayer.js components/lesson/SlideViewer.js components/lesson/LessonProgress.js components/lesson/Paywall.js
git commit -m "feat: restyle lesson player components — clean theme, stories dots, bottom sheet paywall"
```

### Task C4: Wrap lesson page in FullScreenLayout

**Files:**
- Modify: `app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/lesson/[lessonId]/page.js`

- [ ] **Step 1: Read current lesson page**

- [ ] **Step 2: Wrap in FullScreenLayout**

Import FullScreenLayout. Wrap the entire lesson page content in it. Pass lesson title and progress percentage. Remove any existing navbar/chrome. The FullScreenLayout provides the back button and progress bar.

- [ ] **Step 3: Add Continue button at bottom**

Pin a big blue "Continue" button at the bottom of the screen for advancing through sections. Pink accent for the final "Complete Lesson" button.

- [ ] **Step 4: Commit**

```bash
git add "app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/lesson/[lessonId]/page.js"
git commit -m "feat: wrap lesson player in full-screen immersive layout"
```

---

## Phase D: Learn Section UI

### Task D1: Restyle form, term, and subject selection pages

**Files:**
- Modify: `app/learn/page.js`
- Modify: `app/learn/[formId]/page.js`
- Modify: `app/learn/[formId]/[termId]/page.js`

- [ ] **Step 1: Read all 3 files**

- [ ] **Step 2: Restyle form selection**

Blue gradient cards (2x2 grid). Each card: white text on blue gradient background, form number large, "O-Level" subtitle. Rounded-2xl, shadow. Wrap in FeedLayout.

- [ ] **Step 3: Restyle term selection**

3 horizontal cards. Subtle blue color variation (blue-50 → blue-100 → blue-200). Swipeable feel on mobile (horizontal scroll with snap). Wrap in FeedLayout.

- [ ] **Step 4: Restyle subject grid**

2-column grid. White cards with blue border on hover. Subject emoji/icon, name, lesson count. Lock icon (gray) for unsubscribed. "Coming soon" for empty subjects. Tapping locked → trigger BottomSheet paywall. Wrap in FeedLayout.

- [ ] **Step 5: Commit**

```bash
git add app/learn/page.js "app/learn/[formId]/page.js" "app/learn/[formId]/[termId]/page.js"
git commit -m "feat: restyle content browsing — blue gradient cards, feed layout"
```

### Task D2: Restyle units/topics and lesson list pages

**Files:**
- Modify: `app/learn/[formId]/[termId]/[subjectSlug]/page.js`
- Modify: `app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/page.js`

- [ ] **Step 1: Read both files**

- [ ] **Step 2: Restyle units/topics page**

Feed-style: units as expandable white cards. Topics inside with status pills (blue = "In progress", green = "Completed", gray = "Not started", pink outline = "Locked"). Tap topic → navigate. Lock icon on locked units.

- [ ] **Step 3: Restyle topic lessons page**

Lesson cards in a vertical list. Each card: lesson title, progress bar (blue fill), status badge. Wrap in FeedLayout. Add ScrollReveal to each card.

- [ ] **Step 4: Commit**

```bash
git add "app/learn/[formId]/[termId]/[subjectSlug]/page.js" "app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/page.js"
git commit -m "feat: restyle units/topics and lesson list — feed-style cards"
```

### Task D3: Restyle topic test and term exam pages

**Files:**
- Modify: `app/learn/[formId]/[termId]/[subjectSlug]/topic-test/[topicId]/page.js`
- Modify: `app/learn/[formId]/[termId]/term-exam/[subjectSlug]/page.js`

- [ ] **Step 1: Read both files**

- [ ] **Step 2: Apply new color palette and layout**

Replace forest/gold references with blue/pink. Use FeedLayout wrapper. Clean card-based results display. Blue primary buttons, pink accents for achievements.

- [ ] **Step 3: Commit**

```bash
git add "app/learn/[formId]/[termId]/[subjectSlug]/topic-test/[topicId]/page.js" "app/learn/[formId]/[termId]/term-exam/[subjectSlug]/page.js"
git commit -m "feat: restyle topic test and term exam pages"
```

---

## Phase E: Gamification UI

### Task E1: Update dashboard gamification components

**Files:**
- Modify: `components/dashboard/ProgressRings.js`
- Modify: `components/dashboard/StreakCounter.js`
- Modify: `components/dashboard/XPBar.js`

- [ ] **Step 1: Read all 3 files**

- [ ] **Step 2: Update ProgressRings**

SVG rings: blue stroke by default, pink stroke when >80%. Clean white card. Subject name below each ring.

- [ ] **Step 3: Update StreakCounter**

Flame icon: pink/orange when active with `animate-pulse-pink`, gray when 0. Show day count prominently.

- [ ] **Step 4: Update XPBar**

Blue progress bar fill. Pink glow at the fill edge when close to level-up. Level number in blue badge.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/ProgressRings.js components/dashboard/StreakCounter.js components/dashboard/XPBar.js
git commit -m "feat: update gamification components — blue/pink rings, animated streak, XP bar"
```

### Task E2: Restyle leaderboard page

**Files:**
- Modify: `app/dashboard/student/leaderboard/page.js`

- [ ] **Step 1: Read current file**

- [ ] **Step 2: Restyle**

- Weekly/Monthly pill toggle: blue active pill, gray inactive
- Top 3: gold (#FFD700), silver (#C0C0C0), bronze (#CD7F32) medal circles
- Current student row: pink-50 background, "You" badge in pink
- Clean white table with subtle borders
- Wrap in FeedLayout

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/student/leaderboard/page.js
git commit -m "feat: restyle leaderboard — medals, pink highlights, feed layout"
```

### Task E3: Integrate FloatingXP and LevelUpOverlay into lesson flow

**Files:**
- Modify: `app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/lesson/[lessonId]/page.js`

- [ ] **Step 1: Read lesson player page**

- [ ] **Step 2: Add XP animations**

When a quiz is passed or section completed:
- Show FloatingXP component with the XP amount
- If level changed (compare before/after XP), show LevelUpOverlay

Add state for `floatingXP` (amount or null) and `levelUp` (level or null). Render the components conditionally.

- [ ] **Step 3: Commit**

```bash
git add "app/learn/[formId]/[termId]/[subjectSlug]/[topicId]/lesson/[lessonId]/page.js"
git commit -m "feat: add XP and level-up animations to lesson player"
```

---

## Phase F: Onboarding + Settings UI

### Task F1: Restyle onboarding flow

**Files:**
- Modify: `app/onboarding/layout.js`
- Modify: `app/onboarding/page.js`
- Modify: `components/onboarding/PersonalityQuiz.js`
- Modify: `components/onboarding/TierRecommendation.js`

- [ ] **Step 1: Read all 4 files**

- [ ] **Step 2: Update onboarding layout**

Clean white background. Logo matches TopBar style ("Rent**a**Tutor"). Centered max-w-lg. Step dots at top (small circles: blue = current, filled blue = done, gray = future).

- [ ] **Step 3: Update onboarding page**

Welcome screen: 4 large tappable cards for question count (not buttons). Each card shows count + time estimate. Blue borders, pink highlight on hover.
Subject interests: pill/chip grid. Blue fill when selected, gray when not. Tap to toggle.
Done screen: "You're all set!" with blue "Start learning" button.

- [ ] **Step 4: Update PersonalityQuiz**

One-at-a-time mode matching QuizOneAtATime style. Big text, 3 large option buttons. Blue active state. Progress bar (blue fill). Back button.

- [ ] **Step 5: Update TierRecommendation**

3 tier cards side by side (horizontal scroll on mobile). Recommended has pink "Recommended" badge. Selected has blue border. Clean white cards.

- [ ] **Step 6: Commit**

```bash
git add app/onboarding/ components/onboarding/
git commit -m "feat: restyle onboarding — card-based, dot steps, blue/pink theme"
```

### Task F2: Restyle settings page

**Files:**
- Modify: `app/dashboard/student/settings/page.js`

- [ ] **Step 1: Read current file**

- [ ] **Step 2: Restyle as feed sections**

Wrap in FeedLayout. Each section is a white card:
- Profile: clean inputs with blue focus borders
- Learning tier: 3 cards, current has blue border, tap to switch
- Personalization: expandable question cards. Answered = blue selected option. Unanswered = pink dot indicator. Progress bar at top (blue fill).
- Subjects: pill/chip grid matching onboarding style
- Subscription: card with plan info, blue "Manage" link

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/student/settings/page.js
git commit -m "feat: restyle settings page — feed-style cards, blue/pink theme"
```

### Task F3: Restyle homepage

**Files:**
- Modify: `app/page.js`

- [ ] **Step 1: Read current homepage**

- [ ] **Step 2: Restyle**

- Hero: blue gradient background, white text, "Learn smarter with Zambia's curriculum". Pink accent CTA button.
- Subject grid: 2-3 column grid of white cards with emoji icons
- How it works: 5 numbered steps with blue circle numbers, connecting lines
- Pricing: 3 plan cards (white, blue border on hover, pink "Popular" badge on Term plan)
- Footer CTA: "Start learning today" blue button

Use ScrollReveal on each section for entrance animations.

- [ ] **Step 3: Commit**

```bash
git add app/page.js
git commit -m "feat: restyle homepage — blue gradient hero, pricing cards, scroll animations"
```

---

## Execution Order Summary

```
Phase A (Tasks A1-A5): Design system + layout     — FOUNDATION
  ↓
Phase B (Tasks B1-B3): Home feed                   — parallel with C, D, F
Phase C (Tasks C1-C4): Lesson player UI            — parallel with B, D, F
Phase D (Tasks D1-D3): Learn section UI            — parallel with B, C, F
Phase F (Tasks F1-F3): Onboarding + settings UI    — parallel with B, C, D
  ↓
Phase E (Tasks E1-E3): Gamification UI             — after B (needs feed cards)
```

Total: 6 phases, 21 tasks.
