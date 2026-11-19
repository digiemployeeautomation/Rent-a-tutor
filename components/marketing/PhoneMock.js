// A static, HTML-built picture of a real lesson step (the "What is a fraction?"
// quick check), shown in a phone frame on the landing page hero.
import { Check, CheckCircle2, CloudDownload, X } from 'lucide-react'

const OPTIONS = ['3/8', '5/8', '5/3', '8/5']
const LETTERS = ['A', 'B', 'C', 'D']

export default function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]" aria-hidden="true">
      {/* soft glow */}
      <div className="absolute -inset-10 rounded-full bg-blue-600/25 blur-3xl" />

      <div className="relative rounded-[2.5rem] border border-white/10 bg-ink-800 p-2.5 shadow-2xl">
        <div className="overflow-hidden rounded-[2rem] bg-paper">
          {/* status bar + notch */}
          <div className="relative flex h-7 items-center justify-between bg-white px-6 text-[10px] font-semibold text-ink-700">
            <span>9:41</span>
            <span className="absolute left-1/2 top-1.5 h-4 w-20 -translate-x-1/2 rounded-full bg-ink-900" />
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-700" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink-700" />
              <span className="h-1.5 w-3 rounded-sm bg-ink-700" />
            </span>
          </div>

          {/* lesson header */}
          <div className="border-b border-ink-100 bg-white px-4 pb-3 pt-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink-50 text-ink-400">
                <X className="h-3.5 w-3.5" />
              </span>
              <div className="progress-track h-1.5 flex-1">
                <div className="h-full w-[31%] rounded-full bg-blue-600" />
              </div>
              <span className="text-[10px] font-semibold text-ink-400">4/13</span>
            </div>
          </div>

          {/* step body */}
          <div className="px-4 pb-4 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">Quick check</p>
            <p className="mt-1.5 font-display text-[15px] font-semibold leading-snug text-ink-900">
              A loaf is cut into 8 equal slices. The family eats 3 slices. What fraction of the loaf is left?
            </p>

            <div className="mt-3 grid gap-2">
              {OPTIONS.map((opt, i) => {
                const right = i === 1
                return (
                  <div
                    key={opt}
                    className={`flex items-center gap-2.5 rounded-xl border-2 px-2.5 py-1.5 text-[13px] ${
                      right ? 'border-emerald-500 bg-emerald-50 text-ink-900' : 'border-ink-100 bg-white text-ink-500 opacity-70'
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                      right ? 'bg-emerald-600 text-white' : 'bg-ink-100 text-ink-500'
                    }`}>
                      {right ? <Check className="h-3 w-3" /> : LETTERS[i]}
                    </span>
                    <span className="font-medium">{opt}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <p className="text-[11px] leading-snug text-emerald-900">
                <span className="font-bold">Correct.</span> 8 − 3 = 5 slices are left, out of 8 equal slices, so 5/8 is left.
              </p>
            </div>

            <div className="mt-3 flex h-9 items-center justify-center rounded-xl bg-blue-600 text-[12px] font-semibold text-white">
              Continue
            </div>
          </div>
        </div>
      </div>

      {/* floating "saved offline" note */}
      <div className="absolute -bottom-6 -left-3 flex items-center gap-2 rounded-2xl border border-ink-100 bg-white px-3 py-2 shadow-lift sm:-left-12">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <CloudDownload className="h-4 w-4" />
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-semibold text-ink-900">Saved on this phone</span>
          <span className="block text-[10px] text-ink-400">Opens with no internet</span>
        </span>
      </div>

      {/* floating subject tag */}
      <div className="absolute -right-3 -top-5 rounded-2xl border border-ink-100 bg-white px-3 py-2 shadow-lift sm:-right-12">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-400">Mathematics · Form 1</span>
        <span className="block text-[12px] font-semibold text-ink-900">What is a fraction?</span>
      </div>
    </div>
  )
}
