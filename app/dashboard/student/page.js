import Link from 'next/link'

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-forest-600">
          Rent a <span className="text-gold-500 italic">Tutor</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/browse" className="text-gray-500 hover:text-gray-900">Browse</Link>
          <Link href="/exam-prep" className="text-gray-500 hover:text-gray-900">Exam prep</Link>
          <div className="w-8 h-8 bg-sage-100 text-forest-600 rounded-full flex items-center justify-center text-xs font-medium">
            ST
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl mb-1">Good morning 👋</h1>
        <p className="text-gray-500 text-sm mb-8">Here's what's happening with your learning.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Lessons watched', value: '12' },
            { label: 'Sessions booked', value: '3' },
            { label: 'Subjects enrolled', value: '4' },
            { label: 'Exam bundles', value: '1' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className="font-serif text-2xl text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Recent lessons */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="font-serif text-lg">Continue learning</h2>
            <Link href="/browse" className="text-sm text-forest-500">Browse more →</Link>
          </div>
          <div className="space-y-3">
            {[
              { subject: 'Mathematics', title: 'Quadratic equations — part 2', tutor: 'Mrs. Mary Mwale', progress: 60 },
              { subject: 'Physics', title: 'Newton\'s laws of motion', tutor: 'Tonde Chanda', progress: 30 },
              { subject: 'English', title: 'Essay writing techniques', tutor: 'Brenda Mutale', progress: 80 },
            ].map(l => (
              <div key={l.title} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center text-xs font-medium text-forest-600">
                  {l.subject.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{l.title}</div>
                  <div className="text-xs text-gray-400">{l.tutor}</div>
                  <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5">
                    <div className="bg-forest-500 h-1 rounded-full" style={{ width: `${l.progress}%` }} />
                  </div>
                </div>
                <span className="text-xs text-gray-400">{l.progress}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="font-serif text-lg">Upcoming sessions</h2>
            <Link href="/tutor" className="text-sm text-forest-500">Book a tutor →</Link>
          </div>
          <div className="space-y-3">
            {[
              { tutor: 'Mrs. Mary Mwale', subject: 'Mathematics', date: 'Tomorrow, 10:00 AM', status: 'Confirmed' },
              { tutor: 'Tonde Chanda', subject: 'Physics', date: 'Friday, 2:00 PM', status: 'Confirmed' },
            ].map(s => (
              <div key={s.tutor + s.date} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gold-100 rounded-full flex items-center justify-center text-xs font-medium text-gold-500">
                    {s.tutor.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{s.tutor}</div>
                    <div className="text-xs text-gray-400">{s.subject} · {s.date}</div>
                  </div>
                </div>
                <span className="text-xs bg-sage-100 text-forest-600 px-3 py-1 rounded-full">{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
