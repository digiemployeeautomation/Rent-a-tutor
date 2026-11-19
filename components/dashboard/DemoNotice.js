// components/dashboard/DemoNotice.js — one quiet line shown to demo accounts.
export default function DemoNotice() {
  return (
    <div role="note" className="bg-sun-100">
      <p className="container-app py-2 text-[13px] leading-5 text-ink-800">
        <span className="font-bold text-ink-900">Demo account.</span> Nothing here affects real students.
        <span className="hidden sm:inline"> Explore freely.</span>
      </p>
    </div>
  )
}
