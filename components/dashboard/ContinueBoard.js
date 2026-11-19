// components/dashboard/ContinueBoard.js — the chalkboard: the next lesson to open.
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ChalkDoodles from '@/components/art/ChalkDoodles'
import SubjectArt from '@/components/art/SubjectArt'
import Segments from '@/components/kit/Segments'
import { PASS_MARK } from '@/lib/highschool/subjects'

const DOODLES = {
  mathematics: 'maths',
  biology: 'science',
  chemistry: 'science',
  physics: 'science',
  'english-language': 'language',
}

// The wide sketches sit beside the text, so they only show once there is room
// (desktop). Below that, the subject's own drawing is chalked in the corner.
const DOODLE_CLASS = 'max-lg:!hidden lg:max-h-[370px]'
const CORNER_ART = 'absolute right-4 top-5 -z-10 h-12 w-12 sm:right-10 sm:top-1/2 sm:h-28 sm:w-28 sm:-translate-y-1/2 lg:hidden'
const TEXT_COLUMN = 'max-w-[32rem] sm:max-lg:max-w-none sm:max-lg:pr-36'
const TITLE = 'font-display font-semibold text-chalk text-[1.75rem] leading-[1.12] sm:text-[2.5rem] sm:leading-[1.08]'

// next = { lesson, meta, position, count, done, href, last } | null
// mode = 'start' | 'continue' | 'retry'
export default function ContinueBoard({ next, mode }) {
  if (!next) {
    return (
      <section className="board px-5 py-7 sm:px-10 sm:py-10" aria-labelledby="continue-title">
        <ChalkDoodles variant="maths" className={DOODLE_CLASS} />
        <SubjectArt name="quiz" tone="chalk" className={CORNER_ART} />
        <div className={TEXT_COLUMN}>
          <p className="text-[13px] font-bold leading-5 text-sun-300">All lessons complete</p>
          <h2 id="continue-title" className={`mt-2 max-w-[13ch] text-balance sm:max-w-none ${TITLE}`}>You have finished every lesson</h2>
          <p className="board-soft mt-3 max-w-[26rem] text-[15px] leading-relaxed sm:text-[17px]">
            New topics are added as they are written. Review any lesson in the meantime.
          </p>
          <Link href="/learn/high-school" className="btn-chalk btn-lg group mt-7 w-full sm:w-auto">
            Review lessons <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    )
  }

  const { lesson, meta, position, count, done, href, last } = next
  // Smallest score that passes (avoids float noise such as 0.6 * 5 = 3.0000000000000004).
  const passMark = last ? Math.ceil(last.total * PASS_MARK - 1e-9) : 0
  const opener = mode === 'start' ? 'Start here' : mode === 'retry' ? 'Pick up where you left off' : 'Continue learning'
  const cta = mode === 'start' ? 'Start lesson' : mode === 'retry' ? 'Try again' : 'Continue lesson'
  const facts = [`${lesson.minutes} min`, lesson.questionCount > 0 ? `${lesson.questionCount}-question quiz` : null].filter(Boolean)

  return (
    <section className="board px-5 py-7 sm:px-10 sm:py-10" aria-labelledby="continue-title">
      <ChalkDoodles variant={DOODLES[lesson.subject] || 'maths'} className={DOODLE_CLASS} />

      <SubjectArt name={lesson.subject} tone="chalk" className={CORNER_ART} />

      <div className={TEXT_COLUMN}>
        <p className="text-[13px] font-bold leading-5 text-sun-300">{opener}</p>
        <h2 id="continue-title" className={`mt-2 max-w-[13ch] text-balance sm:max-w-none ${TITLE}`}>{lesson.title}</h2>
        <p className="board-soft mt-3 text-[15px] font-semibold leading-snug">
          {meta.name} · Form {lesson.form} · {lesson.topic}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Segments total={count} done={done} tone="chalk" className="w-28 shrink-0 sm:w-36" label={`${done} of ${count} ${meta.name} lessons complete`} />
          <p className="text-[13px] font-bold text-chalk tabular">Lesson {position} of {count}</p>
        </div>

        <p className="board-soft mt-3 text-[15px] leading-relaxed tabular">
          {facts.join(' · ')}
          {mode === 'retry' && last ? (
            <>
              <span className="max-sm:hidden"> · </span>
              <span className="whitespace-nowrap max-sm:block">
                <span className="font-semibold text-sun-300">Last score {last.score}/{last.total}</span>, pass mark {passMark}
              </span>
            </>
          ) : null}
        </p>

        <Link href={href} className={`${mode === 'retry' ? 'btn-accent' : 'btn-chalk'} btn-lg group mt-7 w-full sm:w-auto`}>
          {cta} <ArrowRight className="nudge h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
