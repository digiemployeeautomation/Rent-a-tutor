'use client'
import LessonPlayer from '@/components/lesson/LessonPlayer'
import LessonDownload from '@/components/offline/LessonDownload'

// Client wrapper for the online lesson page: the player + offline actions.
export default function LessonScreen({ lesson, meta, next, backHref }) {
  return (
    <LessonPlayer
      lesson={lesson}
      meta={meta}
      next={next}
      backHref={backHref}
      actions={<LessonDownload lesson={lesson} />}
    />
  )
}
