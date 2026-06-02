// app/practice/speaking/[itemId]/page.js
//
// Server component that loads a Speaking practice item and renders the prompt,
// prep instructions, and the in-browser recorder. Auth-gated via the
// server-side Supabase client.
import { redirect } from 'next/navigation'
import { createServerComponentClientFor } from '@/lib/supabaseServer'
import Recorder from '@/components/practice/Recorder'

export default async function SpeakingPracticePage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/practice/speaking/${params.itemId}`)
  }

  const { data: item, error } = await supabase
    .from('practice_items')
    .select('id, type, sub_skill, variant, payload, status')
    .eq('id', params.itemId)
    .single()

  if (error || !item || item.status !== 'published' || item.type !== 'speaking_task') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-800">Practice item not found</h1>
        <p className="mt-2 text-gray-500">
          This task does not exist or is not available right now.
        </p>
      </main>
    )
  }

  const payload = item.payload ?? {}
  const partLabel = subSkillToLabel(item.sub_skill)
  const prepText = prepInstructions(item.sub_skill)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
        <span>{partLabel}</span>
        {payload.prep_seconds ? (<><span>•</span><span>{payload.prep_seconds}s prep</span></>) : null}
        {payload.speak_seconds ? (<><span>•</span><span>speak up to {Math.round(payload.speak_seconds / 60)} min</span></>) : null}
      </div>

      <h1 className="text-3xl font-bold text-gray-800">{payload.title || 'Speaking task'}</h1>

      <div className="mt-6 whitespace-pre-line rounded-2xl bg-blue-50 p-6 text-sm text-gray-800">
        {payload.prompt}
      </div>

      {prepText ? (
        <p className="mt-4 text-sm text-gray-500">{prepText}</p>
      ) : null}

      <div className="mt-8">
        <Recorder itemId={item.id} />
      </div>

      <p className="mt-8 text-xs text-gray-400">
        Record your answer aloud as if you were speaking to an examiner. We transcribe your
        recording and estimate a band score. This is not an official IELTS result.
      </p>
    </main>
  )
}

function subSkillToLabel(s) {
  switch (s) {
    case 'speaking-part-1': return 'Speaking Part 1'
    case 'speaking-part-2': return 'Speaking Part 2 (Cue card)'
    case 'speaking-part-3': return 'Speaking Part 3'
    default: return 'Speaking'
  }
}

function prepInstructions(s) {
  switch (s) {
    case 'speaking-part-1':
      return 'Answer naturally in a few sentences, as you would in a short interview.'
    case 'speaking-part-2':
      return 'You have about one minute to prepare, then speak for one to two minutes covering all the points on the cue card.'
    case 'speaking-part-3':
      return 'Give a developed answer with reasons and examples, as in a discussion.'
    default:
      return ''
  }
}
