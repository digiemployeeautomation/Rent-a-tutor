// app/practice/listening/[itemId]/page.js
//
// Server component that loads a Listening set, signs its audio URL (private
// bucket → short-lived signed URL via the service-role client), and renders
// the AudioPlayer beside the shared QuestionSetRunner. Auth-gated; answer keys
// are never selected here (client-readable columns only). A missing or
// unsignable audio file shows a friendly notice; the questions still work.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  createServerComponentClientFor,
  createServiceRoleClient,
} from '@/lib/supabaseServer'
import { signedAudioUrl, PRACTICE_AUDIO_BUCKET } from '@/lib/storage/audio'
import QuestionSetRunner from '@/components/practice/QuestionSetRunner'
import AudioPlayer from '@/components/practice/AudioPlayer'
import SetHeader from '@/components/ielts/SetHeader'

export const dynamic = 'force-dynamic'

export default async function ListeningPracticePage({ params }) {
  const supabase = createServerComponentClientFor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=/practice/listening/${params.itemId}`)
  }

  const { data: item, error } = await supabase
    .from('practice_items')
    .select('id, type, sub_skill, variant, payload, status')
    .eq('id', params.itemId)
    .maybeSingle()

  if (error || !item || item.status !== 'published' || item.type !== 'listening_set') {
    return (
      <div className="container-read py-12 sm:py-16">
        <p className="eyebrow !text-copper-700">IELTS Listening</p>
        <h1 className="h-page mt-2">Practice set not found</h1>
        <p className="lead mt-3">This listening set does not exist or is not available right now.</p>
        <Link href="/practice" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to IELTS
        </Link>
      </div>
    )
  }

  const { data: questions } = await supabase
    .from('practice_questions')
    .select('id, position, prompt, question_type, options')
    .eq('practice_item_id', item.id)
    .order('position', { ascending: true })

  const qs = questions ?? []
  const payload = item.payload ?? {}

  // Sign the audio URL with the service role (private bucket). Guarded so a
  // missing file does not crash the page.
  let audioSrc = null
  if (payload.audio_path) {
    try {
      const admin = createServiceRoleClient()
      audioSrc = await signedAudioUrl(admin, {
        bucket: PRACTICE_AUDIO_BUCKET,
        path: payload.audio_path,
      })
    } catch {
      audioSrc = null
    }
  }

  const facts = [
    payload.section ? `Part ${payload.section}` : null,
    `${qs.length} question${qs.length === 1 ? '' : 's'}`,
    'Marked instantly',
  ]

  return (
    <div className="container-app pb-6 pt-4 sm:pt-6">
      <SetHeader
        eyebrow="IELTS Listening"
        title={payload.title || 'Listening set'}
        chips={facts}
      >
        <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink-600">
          Play the recording and answer the questions as you listen. When you finish, press “Check answers”.
          <span className="lg:hidden"> In the real test you hear each recording once. Here you can pause and replay while you practise.</span>
        </p>
      </SetHeader>

      <div className="mt-5 sm:mt-8">
        <QuestionSetRunner
          item={{ ...item, payload: { ...payload, transcript: undefined } }}
          questions={qs}
          resultBase={`/practice/listening/${item.id}/result`}
          asideTitle="Recording"
          asideKind="audio"
          aside={<AudioPlayer src={audioSrc} title={payload.title ? `Recording: ${payload.title}` : undefined} />}
        />
      </div>
    </div>
  )
}
