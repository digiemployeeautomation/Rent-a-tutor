# Rent a Tutor — IELTS Prep Platform

Fully-automated IELTS preparation: AI-graded Writing and Speaking, deterministic Listening and Reading, calibrated band-score feedback, and personalized study plans per sub-skill.

## Status

Pivoting from a Zambian O-Level schools product to IELTS-only as of 2026-05-20. Schools code is preserved under `archive/schools-v1/` and is not referenced from any live route. See `docs/business-plan.md` for current focus and `docs/superpowers/specs/2026-05-20-ielts-pivot-design.md` for the design.

## Tech stack

- Next.js 14 (App Router)
- Supabase (Postgres, Auth, Storage)
- Vercel AI Gateway (Claude Sonnet 4.6, Whisper)
- Vercel Workflow for the Speaking grading pipeline
- Tailwind CSS
- Vitest for pure-function unit tests

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest
npm run build      # production build
```

## Environment

Copy `.env.example` to `.env.local` and fill in Supabase + AI Gateway credentials.

Set `USE_STUB_GRADER=true` for local development without an AI Gateway key — submissions are graded by a deterministic stub.

## Project layout

- `app/` — Next.js App Router routes
- `components/` — shared React components
- `lib/` — utilities, AI Gateway client, block engine, track rules
- `supabase/migrations/` — schema migrations
- `docs/superpowers/specs/` — design specs
- `docs/superpowers/plans/` — implementation plans
- `archive/schools-v1/` — paused schools product, preserved for later re-introduction
