// components/dashboard/DashboardSkeleton.js — still, quiet blocks in the dashboard's shape.
function Block({ className = '' }) {
  return <div className={`rounded bg-ink-100 ${className}`} />
}

function Column({ rows }) {
  return (
    <div className="min-w-0">
      <div className="border-b-2 border-ink-200 pb-3"><Block className="h-6 w-32" /></div>
      <div className="flex items-center gap-4 py-7">
        <Block className="h-14 w-12" />
        <div className="space-y-2"><Block className="h-4 w-44" /><Block className="h-3 w-32" /></div>
      </div>
      <div className="divide-y divide-ink-100 border-y border-ink-100">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex h-16 items-center gap-4">
            <Block className="h-10 w-10 rounded-lg" />
            <Block className="h-4 w-32" />
            <Block className="ml-auto h-2 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardSkeleton() {
  return (
    <div className="container-app pb-16 pt-8 sm:pb-24 sm:pt-12" aria-busy="true" aria-label="Loading your dashboard">
      <Block className="h-8 w-64 max-w-full sm:h-10" />
      <Block className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-6 h-[22rem] rounded-2xl bg-ink-100 sm:mt-8 sm:h-[21rem]" />
      <div className="mt-12 grid gap-x-16 gap-y-14 sm:mt-16 lg:grid-cols-2">
        <Column rows={5} />
        <Column rows={4} />
      </div>
    </div>
  )
}
