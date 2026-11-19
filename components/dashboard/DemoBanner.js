// components/dashboard/DemoBanner.js — slim notice shown to demo accounts.
import { FlaskConical } from 'lucide-react'

export default function DemoBanner() {
  return (
    <div role="note" className="flex items-start gap-2.5 rounded-xl border border-sun-200 bg-sun-50 px-4 py-2.5 text-sm text-ink-700 sm:items-center">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-sun-600 sm:mt-0" aria-hidden="true" />
      <p>
        <span className="font-semibold text-ink-900">You&apos;re in a demo account</span> — explore freely. Nothing here affects real students.
      </p>
    </div>
  )
}
