// components/dashboard/DashboardSkeleton.js — loading placeholder with the dashboard's shape.
function Bar({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-ink-100 ${className}`} />
}

export default function DashboardSkeleton() {
  return (
    <div className="container-app space-y-6 py-6 sm:space-y-8 sm:py-10" aria-busy="true" aria-label="Loading your dashboard">
      <div className="space-y-2">
        <Bar className="h-8 w-60" />
        <Bar className="h-4 w-72 max-w-full" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-ink-800/90 sm:h-48" />
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="card card-pad space-y-4">
            <div className="flex items-center gap-3"><Bar className="h-11 w-11 rounded-xl" /><Bar className="h-5 w-32" /></div>
            <Bar className="h-8 w-24" />
            <Bar className="h-2 w-full" />
            <Bar className="h-10 w-full" />
            <Bar className="h-10 w-full" />
            <Bar className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
