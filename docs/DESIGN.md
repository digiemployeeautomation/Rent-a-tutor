# Rent a Tutor — design system "Workbook" (Nov 2026 redesign)

Read this before touching any screen. The previous build worked but looked
machine-made: Inter, default blue, a shadowed rounded card around everything,
an icon in a coloured tile above every heading, pills everywhere, a dark
gradient hero. This redesign replaces that with one clear idea.

## The idea

**A well-printed school workbook, and the chalkboard it is taught from.**
Students here learn from exercise books, printed past papers and a green
chalkboard. The interface borrows from those objects: paper-white pages,
ruled lines, numbered contents pages with dotted leaders, big printed
numerals, a teacher's tick, a rubber stamp on a finished exercise, and one
dark chalkboard-green surface with faint chalk sketches.

Voice in three words: **plain-spoken, exact, encouraging.**

Users: Zambian secondary students (13-18) and IELTS candidates, mostly on
phones, slow data, English as a second language, often outdoors in bright
light. So: light theme, high contrast, large tap targets, short sentences.
The demo audience is an IT company evaluating the product: it must look
considered and professional, and be understood in seconds.

## Design context (summary)

- **Principles**: (1) one idea per screen, one primary action; (2) structure
  with type, space and rules, not boxes; (3) numbers are content: show them
  large and exact; (4) colour means something (green = High School and
  "go", copper = IELTS, yellow = attention, red = wrong); (5) every state is
  designed: empty, loading, error, done.

## Colour (Tailwind names)

| Name | Use |
|---|---|
| `paper` (#F9F9F7) | page background |
| `white` | raised surfaces (cards, sheets, inputs) |
| `ink-900 / 800` | headings / strong text |
| `ink-700 / 600` | body / secondary text |
| `ink-500` | meta text (smallest allowed for text; `ink-400` only for icons, large numerals, placeholders) |
| `ink-300 / 200` | input borders / hairline rules |
| `board-700` | primary buttons, links, active states, High School accents |
| `board-900` | the chalkboard surface (`.board`) |
| `board-50 / 100 / 200` | pale green tints and borders |
| `copper-600 / 700` | IELTS accents, big step numerals, the one warm accent |
| `copper-50 / 100 / 200` | pale copper tints |
| `sun-200 / 300 / 400` | highlighter (`.hl`), "not yet" states, accent button on the board |
| `rose-600 / 700`, `rose-50` | wrong answers and errors only |
| `chalk` (#F8F7EE) | text on the chalkboard |

Old names still compile and map to the new palette (`blue`, `emerald`,
`green` = board; `teal`, `orange` = copper; `amber`, `yellow` = sun; `gray`,
`slate` = ink; `red` = rose). **In files you touch, rewrite them to the real
names** (`blue-600` -> `board-600`, `teal-700` -> `copper-700`, ...).

Colour rules: neutral surfaces carry about 90% of every screen. Green and
copper are accents, so they stay rare and meaningful. Never grey text on a
coloured surface: on the board use `text-chalk` or `.board-soft`. No
gradients, no glows, no glass. High School screens use green accents; IELTS
screens use copper accents (primary buttons stay green everywhere so "go"
always looks the same).

## Type

- **Display: Besley** (`font-display`), a Clarendon like the ones on school
  textbooks. Used for h1/h2 (automatic), page titles, lesson titles and
  **large numerals** (scores, bands, step numbers: add class `numeral`).
  Weight 600 for headings, 500 for numerals. Never below 18px, never for
  body text, buttons or labels.
- **Body: Hanken Grotesk** (`font-sans`, the default). Weights: 400 body,
  600 secondary emphasis, 700 labels, buttons and small headings.
- Scale (use these, do not invent in-between sizes):
  `h-display` (hero, clamp 38-72px) · `h-page` (28/38px) · `h-section`
  (20/22px) · `h-sub` (16px bold sans) · body 17px on reading screens, 15px in
  dense UI · meta 13px semibold · never below 12px.
- Sentence case everywhere. **No uppercase tracked labels** (the old
  "EYEBROW" look). `eyebrow` is now a small bold green line in sentence case;
  use at most one per page.
- Reading measure 60-70 characters (`max-w-[62ch]`, `container-read`).
- Numbers that line up use `tabular`.

## Layout

- Phone first (390px), then 1280px. `container-app` (1120px) for hubs,
  `container-read` (720px) for lessons, tasks and results.
- **Rules and space before boxes.** Group with a heading on a heavy rule
  (`rule-head`), separate rows with hairlines (`rows`), and let whitespace do
  the rest. A `card` is allowed only for one tappable object or a truly
  separate panel (a form, a question, a result). **Never nest cards. Never
  build a grid of identical icon + title + text cards.**
- Lists are contents pages: number, title, dotted `leader`, value. See
  `components/highschool/LessonList.js`.
- Left-aligned and asymmetric by default. Centre only short, final moments
  (a result, an empty state).
- Vertical rhythm: 8 / 12 / 16 / 24 / 40 / 64 / 96. Be generous between
  sections (`mt-16 sm:mt-24`) and tight inside groups.
- Radius: buttons and inputs `rounded-lg` (8px), cards `rounded-xl` (10px),
  the board `rounded-2xl` (12px), tags `rounded` (5px). Only avatars, radio
  dots and option letters are fully round.
- Shadows: none by default. `shadow-sheet` only for a paper sheet lying on
  the board; `shadow-lg` only for menus and toasts.

## Signature elements (use them, sparingly)

| Element | What / when |
|---|---|
| `.board` + `<ChalkDoodles />` | The chalkboard. At most ONE per screen, for the single most important thing (hero, "continue" panel, a result headline). Variants `maths`, `science`, `language`. |
| `<SubjectArt name tone />` | The illustration set (5 subjects, 4 IELTS skills, `offline`, `quiz`). Replaces icon tiles. `tone="board"` High School, `"copper"` IELTS, `"chalk"` on the board. Sizes 48-144px. |
| `numeral` | Big Besley numbers: lesson numbers, step counts, scores, bands. Copper for decorative step numbers, ink/green for results. |
| `rule-head`, `rows`, `leader` | Workbook rules and dotted leaders. |
| `<Segments total done tone />` | Segmented progress for small counts ("2 of 3 lessons"). |
| `<BandScale band target tone />` | IELTS 4-9 ruler with the score and target marked. Use wherever a band is shown. |
| `<Stamp word tone />` | Rubber stamp. Once, on a result screen, beside the score. |
| `.hl` | Yellow highlighter behind 1-3 key words in a heading or a key term in a lesson. Never whole sentences. |
| `.opt-letter` | A / B / C / D in a ring for answer options, like an exam paper. |

Files: `components/art/SubjectArt.js`, `components/art/ChalkDoodles.js`,
`components/kit/{Segments,Stamp,BandScale}.js`, `components/layout/Brand.js`
(`BrandMark`).

## Kit classes (`app/globals.css` — do NOT edit that file or `tailwind.config.js`)

| Class | Use |
|---|---|
| `container-app` / `container-read` | page width + side padding |
| `eyebrow` | one small green line above a page title |
| `h-display`, `h-page`, `h-section`, `h-sub` | headings |
| `lead`, `muted` | intro paragraph, small secondary text |
| `numeral`, `tabular`, `hl`, `link` | big numbers, aligned digits, highlighter, text link |
| `btn-primary` | THE action on a screen (green). One per view. |
| `btn-secondary` / `btn-ghost` | other actions (outline / text) |
| `btn-chalk` / `btn-accent` | primary / secondary action on the board |
| `btn-copper`, `btn-dark` | rare: IELTS exam start; destructive-neutral |
| `btn-lg`, `btn-sm` | sizes (add to any btn) |
| `card`, `card-pad`, `card-hover` | white bordered surface; hover darkens the border |
| `sheet` | paper sheet with a soft shadow (on the board or hero only) |
| `rule-head`, `rows`, `leader` | section rule, ruled list, dotted leader |
| `board`, `board-soft`, `board-rule` | chalkboard, secondary text on it, hairline on it |
| `chip`, `chip-blue`, `chip-teal`, `chip-sun`, `chip-rose` | small squared tags. Use few: plain text meta ("Form 1 · 20 min") is usually better |
| `field`, `label` | inputs |
| `progress-track` + `progress-fill` | continuous progress bar |
| `opt-letter` | exam option letter |
| `nudge` | arrow that slides 3px when its `group` parent is hovered |
| `animate-fade-in-up` + `stagger` on the parent | page-load entrance (first screen only) |
| `no-print` | hide when printing |

Icons: `lucide-react`, 16-20px, `aria-hidden="true"`, only where they help
recognition (arrows, tick, clock, download, play, mic). Not as decoration and
never in a coloured tile.

## Banned (these are the "AI-made" tells: do not ship any of them)

- A coloured stripe on one side of a card or callout (`border-l-4` etc.).
  Use a tinted background with a text label, or a leading numeral.
- Gradient text, gradient buttons, gradient or glowing hero backgrounds.
- An icon inside a rounded coloured square above a heading (`icon-tile`).
- Grids of identical cards (icon + heading + text), and cards inside cards.
- Uppercase letter-spaced mini labels, pill-shaped tags in rows.
- "Hero metric" blocks (big number + tiny label + more stats in a row).
- Everything centred. Drop shadows on ordinary cards. Glass / blur panels.
- Bounce or elastic motion. Emoji as icons.
- Invented statistics, testimonials, student counts, partner logos, prices.

## Motion

- 150ms colour transitions on controls (built into the kit). Buttons press
  down 1px.
- One entrance per screen: `animate-fade-in-up` with `stagger`, on the first
  view only. Never animate on every scroll.
- State changes worth marking: answer checked (colour + icon), progress bar
  growing, the stamp landing, a download finishing.
- Only `transform` and `opacity`. Easing `ease-out` (already expo-style).
  `prefers-reduced-motion` is handled globally.

## UX rules

- Plain words. "Check answer", not "Submit response". Say what happens next.
- Tap targets >= 44px. The mobile tab bar is 64px tall: fixed bottom bars sit
  at `bottom-16 md:bottom-0`.
- Always show loading (quiet skeleton blocks, no shimmer rainbow) and a
  friendly error with a way forward. Empty states teach: what this is, what
  to do, one button.
- Accessible: real `<button>`/`<a>`, labels on inputs, visible focus (built
  in), contrast AA (meta text is `ink-500` or darker).
- Honest copy: the product is completely free; Writing/Speaking marking shows
  "sample feedback" when no AI key is configured. Keep those notices.

## Code conventions

- Next.js 14 App Router, JavaScript, **no semicolons, 2-space indent, single
  quotes**. Tailwind for styling. Server components by default.
- Do not change behaviour, data fetching, routes, props contracts or copy
  that states facts. This is a visual and layout redesign. You may reword
  labels to be shorter and plainer.
- `practice_questions.answer_key` and `.explanation` are server-only: never
  select them with a user-scoped client.

## Reference implementations (match these)

- `app/learn/high-school/page.js` + `components/highschool/SubjectGrid.js`
  (hub: display heading, ruled subject index with art and segments)
- `app/learn/high-school/[subject]/page.js` +
  `components/highschool/LessonList.js` (contents-page list)
- `components/layout/Navbar.js`, `BottomTabs.js`, `Brand.js`
- Dashboard: `app/dashboard/student/page.js` + `components/dashboard/*`
- Lesson player: `components/lesson/LessonPlayer.js`
- IELTS: `app/practice/page.js`, `components/practice/SetResult.js`

## Working in parallel (important)

Several people are editing this repo at the same time.

- Only edit the files you were assigned. Never edit `app/globals.css`,
  `tailwind.config.js`, `app/layout.js`, `components/layout/*`,
  `components/art/*`, `components/kit/*`, `package.json`. If the kit is
  missing something you need, build it locally in your own file and mention
  it in your report.
- Do NOT run `npm run dev`, `npm run build`, `npm install`, or any git
  command. A dev server is already running at **http://localhost:3210** with
  hot reload.
- Screenshots (this is how you judge your work; look at every screen you
  change, at phone and desktop width, and iterate until it is right):
  `cd "C:/Users/sbula/AppData/Local/Temp/claude/8f32d8ea0dfe2c45/9f213d04-1566-4ba7-8cef-51a75414d8ad/scratchpad/qa" && MSYS_NO_PATHCONV=1 node snap.mjs <yourFolder> both name=/path name2=/path2`
  Add `--demo` (anywhere in the args) for pages that need a signed-in
  student; it signs in through the one-click demo first. Output:
  `<yourFolder>/desktop-<name>.jpg` and `mobile-<name>.jpg` (full page), and
  the console prints horizontal-overflow and page errors. View the JPGs with
  the Read tool. Use your own folder name. Do not use the chrome-devtools MCP.
- Compile errors show in the page and in the dev log
  `C:/Users/sbula/AppData/Local/Temp/claude/8f32d8ea0dfe2c45/9f213d04-1566-4ba7-8cef-51a75414d8ad/scratchpad/dev.log`
  (read only the tail).
- Unit tests must stay green: `npx vitest run <path>` for tests next to the
  files you touch.
