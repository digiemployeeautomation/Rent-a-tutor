import DashboardShell from '@/components/layout/DashboardShell'

export default function TutorDashboardLayout({ children }) {
  return (
    <DashboardShell role="tutor">
      {children}
    </DashboardShell>
  )
}
