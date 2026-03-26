import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

const myLessons = [
  { subject: 'Mx', title: 'Quadratic equations — intro',  rentals: 18, status: 'Live'           },
  { subject: 'Mx', title: 'Quadratic equations — part 2', rentals: 12, status: 'Live'           },
  { subject: 'Ph', title: "Newton's laws of motion",      rentals: 9,  status: 'Live'           },
  { subject: 'Mx', title: 'Simultaneous equations',       rentals: 0,  status: 'Pending review' },
]

const sessionRequests = [
  { initials: 'CM', name: 'Chanda Mutale', subject: 'Mathematics', time: 'Tomorrow, 10 AM', grade: 'Form 4' },
  { initials: 'LP', name: 'Luka Phiri',    subject: 'Physics',     time: 'Friday, 3 PM',   grade: 'Form 5' },
  { initials: 'GB', name: 'Grace Banda',   subject: 'Mathematics', time: 'Saturday, 9 AM', grade: 'Form 3' },
]

const earnings = [
  { month: 'Jan', amount: 1200 },
  { month: 'Feb', amount: 1540 },
  { month: 'Mar', amount: 1840 },
]

export default function TutorDashboard() {
  const maxEarning = Math.max(...earnings.map(e => e.amount))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Banner */}
      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>
              Welcome back, Mrs. Mwale 👋
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-nav-text)', opacity: 0.7 }}>
              You have 3 new session requests waiting.
            </p>
          </div>
          <Link
            href="/dashboard/tutor/upload"
            className="text-sm px-5 py-2.5 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}
          >
            + Upload lesson
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Lessons uploaded',    value: '8',     type: 'a' },
            { label: 'Total rentals',        value: '47',    type: 'a' },
            { label: 'Sessions this month',  value: '12',    type: 'b' },
            { label: 'Earnings (ZMW)',        value: 'K1,840', type: 'b' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-4"
              style={{ backgroundColor: s.type === 'a' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)' }}
            >
              <div className="text-xs font-medium mb-1" style={{ color: s.type === 'a' ? 'var(--color-stat-a-sub)' : 'var(--color-stat-b-sub)' }}>
                {s.label}
              </div>
              <div className="font-serif text-3xl" style={{ color: s.type === 'a' ? 'var(--color-stat-a-text)' : 'var(--color-stat-b-text)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* My lessons */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>My lessons</h2>
              <Link href="/dashboard/tutor/upload" className="text-xs hover:underline" style={{ color: 'var(--color-primary-lit)' }}>
                + Upload new
              </Link>
            </div>
            <div className="space-y-3">
              {myLessons.map((l, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium"
                      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}
                    >
                      {l.subject}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{l.title}</div>
                      <div className="text-xs text-gray-400">{l.rentals} rentals</div>
                    </div>
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: l.status === 'Live' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)',
                      color: l.status === 'Live' ? 'var(--color-badge-text)' : 'var(--color-stat-b-sub)',
                    }}
                  >
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-primary)' }}>
            <h2 className="font-serif text-lg mb-1" style={{ color: 'var(--color-nav-text)' }}>Earnings</h2>
            <p className="text-xs mb-5" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Last 3 months</p>
            <div className="space-y-3">
              {earnings.map(e => (
                <div key={e.month}>
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-nav-text)' }}>
                    <span>{e.month}</span>
                    <span style={{ opacity: 0.7 }}>K{e.amount.toLocaleString()}</span>
                  </div>
                  <div className="rounded-full h-2" style={{ backgroundColor: 'var(--color-primary-mid)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.round(e.amount / maxEarning * 100)}%`,
                        backgroundColor: 'var(--color-accent-lit)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-primary-mid)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Available to withdraw</div>
              <div className="font-serif text-2xl mb-3" style={{ color: 'var(--color-accent-lit)' }}>K1,288</div>
              <button
                className="w-full text-xs py-2 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}
              >
                Withdraw via Mobile Money
              </button>
            </div>
          </div>
        </div>

        {/* Session requests */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>Session requests</h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: 'var(--color-stat-b-bg)', color: 'var(--color-stat-b-sub)' }}
            >
              3 pending
            </span>
          </div>
          <div className="space-y-3">
            {sessionRequests.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}
                  >
                    {r.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{r.name}</div>
                    <div className="text-xs text-gray-400">{r.subject} · {r.grade} · {r.time}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-xs px-4 py-1.5 rounded-lg font-medium"
                    style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}
                  >
                    Accept
                  </button>
                  <button className="text-xs border border-gray-200 text-gray-500 px-4 py-1.5 rounded-lg hover:bg-gray-50">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
