// app/practice/reading/[itemId]/page.js
//
// Server component that loads a Reading set and renders the passage plus the
// shared QuestionSetRunner. Auth-gated via the server-side Supabase client;
// the server-only columns (answer_key, explanation) are never selected here —
// client-readable columns only.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Clock, ListChecks, Timer, Zap } from 'lucide-react'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import QuestionSetRunner from '@/components/practice/QuestionSetRunner'
import Passage from '@/components/ielts/Passage'
import SetHeader from '@/components/ielts/SetHeader'
import { proportionalLimit } from '@/lib/ielts/exam-timer'
import { moduleForDrill } from '@/lib/ielts/reading-modules'

export const dynamic = 'force-dynamic'

export default async function ReadingPracticePage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/practice/reading/${params.itemId}`)
  }

  const { data: item, error } = await supabase
    .from('practice_items')
    .select('id, type, sub_skill, variant, payload, status')
    .eq('id', params.itemId)
    .maybeSingle()

  if (error || !item || item.status !== 'published' || item.type !== 'reading_set') {
    return (
      <div className="container-read py-12">
        <h1 className="h-page">Practice set not found</h1>
        <p className="lead mt-2">This reading set does not exist or is not available right now.</p>
        <Link href="/practice" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to IELTS
        </Link>
      </div>
    )
  }

  const [{ data: questions }, { data: modules }] = await Promise.all([
    supabase
      .from('practice_questions')
      .select('id, position, prompt, question_type, options')
      .eq('practice_item_id', item.id)
      .order('position', { ascending: true }),
    supabase
      .from('skill_lessons')
      .select('slug, title, drill_item_id, position')
      .eq('section', 'reading')
      .eq('status', 'published'),
  ])

  const qs = questions ?? []
  const payload = item.payload ?? {}
  const timeLimitSeconds =
    payload.time_limit_seconds ??
    (payload.is_mock ? proportionalLimit(qs.length) : null)
  const lesson = moduleForDrill(modules ?? [], item.id)

  const chips = [
    { label: `${qs.length} question${qs.length === 1 ? '' : 's'}`, icon: ListChecks },
    timeLimitSeconds
      ? { label: `${Math.round(timeLimitSeconds / 60)} min timed`, icon: Timer, tone: 'chip-teal' }
      : payload.minimum_reading_minutes
        ? { label: `About ${payload.minimum_reading_minutes} min`, icon: Clock }
        : null,
    { label: 'Marked instantly', icon: Zap, tone: 'chip-green' },
  ]

  return (
    <div className="container-app py-6 sm:py-8">
      <SetHeader
        backHref={lesson ? `/learn/reading/${lesson.slug}` : '/practice'}
        backLabel={lesson ? `Lesson: ${lesson.title}` : 'IELTS'}
        eyebrow={payload.is_mock ? 'IELTS Reading · Mock exam' : `IELTS Reading · ${variantLabel(item.variant)}`}
        title={payload.title || 'Reading set'}
        chips={chips}
      >
        <p className="mt-3 max-w-2xl text-[15px] text-ink-500">
          {timeLimitSeconds
            ? 'The clock starts now. Read the passage, answer every question, then press “Check answers”. When time runs out your answers lock.'
            : 'Read the passage, answer the questions, then press “Check answers” to see your score and the reason for each answer.'}
        </p>
      </SetHeader>

      <div className="mt-6">
        <QuestionSetRunner
          item={item}
          questions={qs}
          resultBase={`/practice/reading/${item.id}/result`}
          timeLimitSeconds={timeLimitSeconds}
          asideTitle="Reading passage"
          aside={payload.passage ? <Passage text={payload.passage} /> : null}
        />
      </div>
    </div>
  )
}

function variantLabel(v) {
  if (v === 'academic') return 'Academic'
  if (v === 'general') return 'General Training'
  return 'Academic & General'
}
