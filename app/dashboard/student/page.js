import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

const lessons = [
  { subject: 'Mx', title: 'Quadratic equations — part 2', tutor: 'Mrs. Mary Mwale', progress: 60 },
  { subject: 'Ph', title: "Newton's laws of motion",      tutor: 'Tonde Chanda',    progress: 30 },
  { subject: 'En', title: 'Essay writing techniques',     tutor: 'Brenda Mutale',   progress: 80 },
]

const sessions = [
  { initials: 'MM', name: 'Mrs. Mary Mwale', subject: 'Mathematics', time: 'Tomorrow, 10:00 AM' },
  { initials: 'TC', name: 'Tonde Chanda',    subject: 'Physics',     time: 'Friday, 2:00 PM'   },
]

const examProgress = [
  { subject: 'Mathematics', done: 14, total: 20 },
  { subject: 'Science',     done: 8,  total: 18 },
  { subject: 'English',     done: 11, total: 15 },
]

const mySubjects = [
  { initials: 'Mx', name: 'Mathematics', lessons: 84 },
  { initials: 'Sc', name: 'Science',     lessons: 61 },
  { initials: 'En', name: 'English',     lessons: 55 },
  { initials: 'Ch', name: 'Chemistry',   lessons: 48 },
]

export default function StudentDashboard() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' }}>
      <Navbar />

      {/* Banner */}
      <div style={{ backgroundColor: 'var(--color-primary-mid)' }} className="px-6 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl" style={{ color: 'var(--color-nav-text)' }}>
              Good morning, Chanda 👋
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-nav-text)', opacity: 0.7 }}>
              You have 2 sessions coming up this week.
            </p>
          </div>
          <Link
            href="/tutor"
            className="text-sm px-5 py-2.5 rounded-lg font-medium"
            style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}
          >
            Book a session
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Lessons watched',   value: '12', type: 'a' },
            { label: 'Sessions booked',   value: '3',  type: 'a' },
            { label: 'Subjects enrolled', value: '4',  type: 'b' },
            { label: 'Exam bundles',      value: '1',  type: 'b' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: s.type === 'a' ? 'var(--color-stat-a-bg)' : 'var(--color-stat-b-bg)'
              }}
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

          {/* Continue learning */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>Continue learning</h2>
              <Link href="/browse" className="text-xs hover:underline" style={{ color: 'var(--color-primary-lit)' }}>Browse more →</Link>
            </div>
            <div className="space-y-4">
              {lessons.map((l, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}
                  >
                    {l.subject}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 mb-0.5">{l.title}</div>
                    <div className="text-xs text-gray-400 mb-1.5">{l.tutor}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${l.progress}%`, backgroundColor: 'var(--color-progress)' }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{l.progress}%</span>
                    </div>
                  </div>
                  <div className="text-xs opacity-0 group-hover:opacity-100 transition" style={{ color: 'var(--color-primary-lit)' }}>
                    Watch →
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exam prep */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-primary)' }}>
            <h2 className="font-serif text-lg mb-1" style={{ color: 'var(--color-nav-text)' }}>Exam prep</h2>
            <p className="text-xs mb-5" style={{ color: 'var(--color-nav-text)', opacity: 0.6 }}>Form 4 O-Level bundle</p>
            <div className="space-y-4">
              {examProgress.map(e => (
                <div key={e.subject}>
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-nav-text)' }}>
                    <span>{e.subject}</span>
                    <span style={{ opacity: 0.6 }}>{e.done}/{e.total} lessons</span>
                  </div>
                  <div className="rounded-full h-2" style={{ backgroundColor: 'var(--color-primary-mid)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.round(e.done / e.total * 100)}%`,
                        backgroundColor: 'var(--color-accent-lit)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/exam-prep"
              className="mt-5 block text-center text-xs py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-accent-btn)', color: 'var(--color-accent-btn-text)' }}
            >
              Continue studying
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upcoming sessions */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>Upcoming sessions</h2>
              <Link href="/tutor" className="text-xs hover:underline" style={{ color: 'var(--color-primary-lit)' }}>Book a tutor →</Link>
            </div>
            <div className="space-y-3">
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}
                  >
                    {s.initials}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.subject} · {s.time}</div>
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: 'var(--color-stat-a-bg)', color: 'var(--color-badge-text)' }}
                  >
                    Confirmed
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-gray-200 hover:border-gray-300 transition cursor-pointer">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 text-lg">+</div>
                <div className="text-sm text-gray-400">Book another session</div>
              </div>
            </div>
          </div>

          {/* My subjects */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>My subjects</h2>
              <Link href="/browse" className="text-xs hover:underline" style={{ color: 'var(--color-primary-lit)' }}>All →</Link>
            </div>
            <div className="space-y-2">
              {mySubjects.map(s => (
                <div key={s.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-mid)' }}
                  >
                    {s.initials}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.lessons} lessons</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
