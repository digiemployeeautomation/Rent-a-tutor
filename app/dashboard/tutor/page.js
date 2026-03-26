import Link from 'next/link'

export default function TutorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-forest-600">
          Rent a <span className="text-gold-500 italic">Tutor</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Tutor portal</span>
          <div className="w-8 h-8 bg-gold-100 text-gold-500 rounded-full flex items-center justify-center text-xs font-medium">
            TU
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl mb-1">Tutor dashboard</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your lessons, sessions, and earnings.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Lessons uploaded', value: '8' },
            { label: 'Total rentals', value: '47' },
            { label: 'Sessions this month', value: '12' },
            { label: 'Earnings (ZMW)', value: 'K1,840' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className="font-serif text-2xl text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Upload a lesson', desc: 'Add a new recorded lesson', color: 'bg-forest-600 text-sage-200', href: '/dashboard/tutor/upload' },
            { label: 'View session requests', desc: '3 pending requests', color: 'bg-gold-100 text-gold-600', href: '/dashboard/tutor/sessions' },
            { label: 'Edit my profile', desc: 'Update bio and subjects', color: 'bg-white text-gray-700 border border-gray-200', href: '/dashboard/tutor/profile' },
          ].map(a => (
            <Link key={a.label} href={a.href} className={`${a.color} rounded-xl p-5 block hover:opacity-90`}>
              <div className="text-sm font-medium mb-1">{a.label}</div>
              <div className="text-xs opacity-70">{a.desc}</div>
            </Link>
          ))}
        </div>

        {/* My lessons */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="font-serif text-lg">My lessons</h2>
            <Link href="/dashboard/tutor/upload" className="text-sm text-forest-500">+ Upload new</Link>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Quadratic equations — intro', subject: 'Mathematics', rentals: 18, status: 'Live' },
              { title: 'Quadratic equations — part 2', subject: 'Mathematics', rentals: 12, status: 'Live' },
              { title: "Newton's laws of motion", subject: 'Physics', rentals: 9, status: 'Live' },
              { title: 'Simultaneous equations', subject: 'Mathematics', rentals: 0, status: 'Pending review' },
            ].map(l => (
              <div key={l.title} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-sage-100 rounded-lg flex items-center justify-center text-xs text-forest-600">
                    {l.subject.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{l.title}</div>
                    <div className="text-xs text-gray-400">{l.subject} · {l.rentals} rentals</div>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  l.status === 'Live' ? 'bg-sage-100 text-forest-600' : 'bg-gold-100 text-gold-500'
                }`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending session requests */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-serif text-lg mb-4">Session requests</h2>
          <div className="space-y-3">
            {[
              { student: 'Chanda Mutale', subject: 'Mathematics', requested: 'Tomorrow, 10 AM', grade: 'Form 4' },
              { student: 'Luka Phiri', subject: 'Physics', requested: 'Friday, 3 PM', grade: 'Form 5' },
              { student: 'Grace Banda', subject: 'Mathematics', requested: 'Saturday, 9 AM', grade: 'Form 3' },
            ].map(r => (
              <div key={r.student} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                    {r.student.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{r.student}</div>
                    <div className="text-xs text-gray-400">{r.subject} · {r.grade} · {r.requested}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs bg-forest-600 text-sage-200 px-3 py-1.5 rounded-lg hover:bg-forest-700">Accept</button>
                  <button className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
