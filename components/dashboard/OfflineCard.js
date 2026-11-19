// components/dashboard/OfflineCard.js — nudge towards offline downloads.
import Link from 'next/link'
import { Download, WifiOff } from 'lucide-react'

export default function OfflineCard() {
  return (
    <section className="card card-pad flex flex-col" aria-labelledby="offline-title">
      <span className="icon-tile bg-sun-100 text-sun-600"><WifiOff className="h-5 w-5" aria-hidden="true" /></span>
      <h2 id="offline-title" className="h-section mt-4">Study without internet</h2>
      <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-ink-500">
        Save lessons to this device and study with no internet. Handy for slow data or long journeys.
      </p>
      <Link href="/downloads" className="btn-secondary mt-5 w-full">
        <Download className="h-4 w-4" aria-hidden="true" /> Go to Downloads
      </Link>
    </section>
  )
}
