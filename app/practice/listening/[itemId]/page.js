// app/practice/listening/[itemId]/page.js
//
// Server component that loads a Listening set, signs its audio URL (private
// bucket → short-lived signed URL via the service-role client), and renders
// the AudioPlayer above the shared QuestionSetRunner. Auth-gated; answer keys
// are never selected here (client-readable columns only).
import { redirect } from 'next/navigation'
import {
  createServerComponentClientFor,
  createServiceRoleClient,
} from '@/lib/supabaseServer'
import { signedAudioUrl, PRACTICE_AUDIO_BUCKET } from '@/lib/storage/audio'
import { subSkillLabel } from '@/lib/ielts/sections'
import QuestionSetRunner from '@/components/practice/QuestionSetRunner'
import AudioPlayer from '@/components/practice/AudioPlayer'

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
    .single()

  if (error || !item || item.status !== 'published' || item.type !== 'listening_set') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-800">Practice set not found</h1>
        <p className="mt-2 text-gray-500">
          This listening set does not exist or is not available right now.
        </p>
      </main>
    )
  }

  const { data: questions } = await supabase
    .from('practice_questions')
    .select('id, position, prompt, question_type, options')
    .eq('practice_item_id', item.id)
    .order('position', { ascending: true })

  const payload = item.payload ?? {}

  // Sign the audio URL with the service role (private bucket). Guarded so a
  // missing audio_path does not crash the page (real TTS arrives in Wave 3).
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
        <span>{subSkillLabel(item.sub_skill)}</span>
        <span>•</span>
        <span>{variantLabel(item.variant)}</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-800">{payload.title || 'Listening set'}</h1>

      <div className="mt-6">
        <AudioPlayer src={audioSrc} />
      </div>

      <div className="mt-10">
        <QuestionSetRunner
          item={item}
          questions={questions ?? []}
          resultBase={`/practice/listening/${item.id}/result`}
        />
      </div>
    </main>
  )
}

function variantLabel(v) {
  if (v === 'academic') return 'Academic'
  if (v === 'general') return 'General Training'
  return 'Academic & General'
}
