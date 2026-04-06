# Rent a Tutor

Zambia's online tutoring platform for O-Level and A-Level students.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend / DB**: Supabase (PostgreSQL + Auth + Storage)
- **Video hosting**: Cloudflare Stream
- **Payments**: Airtel Money + MTN Mobile Money
- **Hosting**: Vercel

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure
```
app/
  page.js                  — Homepage
  auth/
    login/page.js          — Login
    register/page.js       — Register (student or tutor)
  dashboard/
    student/page.js        — Student dashboard
    tutor/page.js          — Tutor dashboard
  browse/                  — Browse lessons
  tutor/                   — Find a tutor
components/
  layout/Navbar.js         — Top navigation bar
lib/
  supabase.js              — Supabase client
```

## Curriculum Scope
- O-Level: Forms 1–4 (Key exam: Form 4)
- A-Level: Forms 5–6 (Key exam: Form 6)

## Business Model
- Lesson rentals
- Private session bookings
- Featured tutor profiles
- Exam prep bundles
