// app/admin/layout.js
import AdminShell from '@/components/admin/AdminShell'

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>
}
