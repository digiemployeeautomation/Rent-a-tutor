# Rent a Tutor — design brief (demo build, Nov 2026)

Read this before touching any screen. The goal is one coherent, calm, confident
product: **educational, easy to use, easy to understand**, built phone-first
for students in Zambia (small screens, slow data, English as a second language).

## Product

Online tutoring platform with two courses:

- **High School** — Zambian O-Level syllabus (Forms 1–4). Static lesson files in
  `content/highschool/` rendered by `components/lesson/LessonPlayer.js`
  (`/learn/high-school/...`). Public: guests can read lessons.
- **IELTS** — Listening, Reading, Writing, Speaking practice with instant
  band-score feedback (`/practice/...`, `/learn/reading/...`). Needs sign-in.

Plus **Downloads** (`/downloads`): lessons saved to the device for offline use.

Signed-in nav (desktop bar + mobile bottom tabs) is defined once in
`components/layout/nav-config.js`: Home `/dashboard/student`, High School
`/learn/high-school`, IELTS `/practice`, Downloads `/downloads`.
Visitors get a one-click demo at `/demo` (no sign-up).

## Look and feel

- Background `bg-paper` (#F6F7FB). Surfaces are white cards.
- Text: `text-ink-900` headings, `text-ink-700` body, `text-ink-500` secondary,
  `text-ink-400` meta. Never use `gray-*` in new code — use `ink-*`.
- Primary: `blue-600` (hover `blue-700`). Accent: `sun-400` (amber) — use
  sparingly for highlights and the one "hero" call to action on dark surfaces.
  Dark surfaces: `bg-ink-900` with white text.
- Course colours: High School = blue, IELTS = teal (`teal-600`, `teal-50`).
  Success `emerald`, warning `sun`, error `rose`. **No pink, no purple
  gradients, no emoji as icons.**
- Fonts: headings use the display font (`font-display`, Bricolage Grotesque —
  applied automatically to h1–h4); body is Inter. Both are bundled locally.
- Icons: `lucide-react` only, `h-4 w-4` / `h-5 w-5`, `aria-hidden="true"`.
- Radius: cards `rounded-2xl`, buttons `rounded-xl`, chips `rounded-full`.
- Generous whitespace; one clear primary action per screen; no walls of text.

## Kit classes (defined in `app/globals.css` — do NOT edit that file, do NOT edit `tailwind.config.js`)

| Class | Use |
|---|---|
| `container-app` / `container-read` | page width (max-w-6xl / max-w-3xl) with side padding |
| `eyebrow` | small uppercase blue label above a heading |
| `h-display`, `h-page`, `h-section` | hero heading, page title, section title |
| `lead`, `muted` | intro paragraph, small secondary text |
| `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-dark`, `btn-accent` | buttons (also on `<Link>`); add `btn-lg` or `btn-sm` |
| `card`, `card-pad`, `card-hover` | white surface, standard padding, hover lift for clickable cards |
| `chip`, `chip-blue`, `chip-teal`, `chip-sun`, `chip-green` | small pills/tags |
| `field`, `label` | form inputs and their labels |
| `progress-track` + `progress-fill` | progress bar |
| `icon-tile` | 44px rounded square holding an icon (add colour classes) |
| `no-print` | hide when printing |

Animations available: `animate-fade-in-up`, `animate-fade-in`.

Reference implementations to match: `components/lesson/LessonPlayer.js`,
`components/highschool/SubjectGrid.js`, `app/learn/high-school/[subject]/page.js`,
`components/layout/Navbar.js`.

## UX rules

- Phone first: design at 390px wide, then make it good at 1280px. Tap targets
  ≥ 44px. The mobile bottom tab bar is 64px tall — pages already get bottom
  padding from the shell; fixed bottom bars must sit at `bottom-16 md:bottom-0`.
- Plain words. Say "Check answer", not "Submit response". Explain what happens
  next. Empty states say what to do, with a button.
- Always show loading (skeleton or spinner) and friendly error states.
- Accessible: real `<button>`/`<a>`, labels on inputs, visible focus, good contrast.
- Be honest in copy: no invented statistics, testimonials, student counts,
  partner logos or prices. Describe what the product does.

## Code conventions

- Next.js 14 App Router, JavaScript (no TypeScript), **no semicolons, 2-space
  indent, single quotes**. Tailwind for styling.
- Server components by default; add `'use client'` only when needed.
- Supabase: `lib/supabase.js` (browser), `lib/supabaseServer.js` (server:
  `createServerComponentClientFor()` in pages, `createServerClient()` in route
  handlers, `createServiceRoleClient()` for privileged writes).
- `practice_questions.answer_key` and `.explanation` are server-only columns —
  never select them with a user-scoped client and never add a blanket GRANT.

## Working in parallel (important)

Several people are editing this repo at the same time.

- Only edit the files you were assigned. Never edit `app/globals.css`,
  `tailwind.config.js`, `app/layout.js`, `components/layout/*`, `package.json`.
- Do NOT run `npm run dev`, `npm run build`, `npm install`, or any git command.
  A dev server is already running at **http://localhost:3210** with hot reload.
- Check your pages compile: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3210/<path>`
  For signed-in pages: `node scripts/qa-fetch.mjs /dashboard/student /practice`
  (add `--body` first to print the page text; `--post <path> '<json>'` for APIs).
  Compile/runtime errors appear in the HTML and in the dev log at
  `C:/Users/sbula/AppData/Local/Temp/claude/8f32d8ea0dfe2c45/9f213d04-1566-4ba7-8cef-51a75414d8ad/scratchpad/dev.log` (read only the tail).
- Unit tests: `npx vitest run` must stay green.
- Screenshots of PUBLIC pages (to judge your own design):
  `"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=390,844 --screenshot="<abs path>.png" http://localhost:3210/<path>`
  then view the PNG with the Read tool. Save screenshots in your scratch/temp
  directory, never inside the repo. Do not use the chrome-devtools MCP tools.
