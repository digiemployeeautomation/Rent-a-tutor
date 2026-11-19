// components/dashboard/OfflineNote.js — short pointer to offline downloads.
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SubjectArt from '@/components/art/SubjectArt'

export default function OfflineNote() {
  return (
    <section className="flex min-w-0 items-start gap-3 sm:gap-4" aria-labelledby="offline-title">
      {/* The drawing is a narrow phone in a square box: pull it left so its edge sits on the column edge. */}
      <SubjectArt name="offline" className="-ml-5 h-20 w-20 sm:-ml-6 sm:h-24 sm:w-24" />
      <div className="min-w-0">
        <h2 id="offline-title" className="h-section">Study without internet</h2>
        <p className="mt-1.5 max-w-[40ch] text-[15px] leading-relaxed text-ink-600">
          Save lessons to this device and study with no internet. Handy for slow data or long journeys.
        </p>
        <Link href="/downloads" className="group -mb-3 mt-1 inline-flex items-center gap-1.5 py-3 text-sm font-bold text-board-700 hover:text-board-900">
          Go to Downloads <ArrowRight className="nudge h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
