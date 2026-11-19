// app/dashboard/student/layout.js
// Navigation comes from the global AppShell; this layout only adds a
// skeleton while the dashboard's data loads.
import { Suspense } from 'react'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'

export default function StudentDashboardLayout({ children }) {
  return <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
}
