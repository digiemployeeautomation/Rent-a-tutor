import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

const subjects = [
  { name: 'Mathematics', count: 84, initials: 'Math', bg: 'bg-sage-100', text: 'text-forest-600' },
  { name: 'Science',     count: 61, initials: 'Sci', bg: 'bg-green-100', text: 'text-green-800' },
  { name: 'English',     count: 55, initials: 'Eng', bg: 'bg-blue-100',  text: 'text-blue-800'  },
  { name: 'Chemistry',   count: 48, initials: 'Chem', bg: 'bg-gold-100',  text: 'text-gold-600'  },
  { name: 'Physics',     count: 44, initials: 'Phy', bg: 'bg-purple-100',text: 'text-purple-800'},
  { name: 'Geography',   count: 39, initials: 'Geo', bg: 'bg-orange-100',text: 'text-orange-800'},
  { name: 'History',     count: 32, initials: 'His', bg: 'bg-pink-100',  text: 'text-pink-800'  },
  { name: 'ICT',         count: 27, initials: 'ICT', bg: 'bg-gray-100',  text: 'text-gray-700'  },
]

const tutors = [
  { name: 'Mrs. Mary Mwale',  initials: 'MM', subjects: 'Mathematics · Biology',  badge: 'Certified teacher', badgeStyle: 'bg-sage-100 text-forest-600', forms: 'O-Level · A-Level · Forms 1–6', rating: '4.9', reviews: 38, price: 'K200' },
  { name: 'Tonde Chanda',     initials: 'TC', subjects: 'Mathematics · Physics',  badge: 'Verified tutor',   badgeStyle: 'bg-gray-100 text-gray-700',   forms: 'O-Level · Forms 1–4',         rating: '4.2', reviews: 14, price: 'K120' },
  { name: 'Brenda Mutale',    initials: 'BM', subjects: 'English · Literature',   badge: 'Certified teacher', badgeStyle: 'bg-sage-100 text-forest-600', forms: 'O-Level · A-Level · Forms 1–6', rating: '4.7', reviews: 52, price: 'K180' },
  { name: "Kelvin Ng'andu",   initials: 'KN', subjects: 'Chemistry · Science',    badge: 'Certified teacher', badgeStyle: 'bg-sage-100 text-forest-600', forms: 'O-Level · A-Level · Forms 1–6', rating: '4.5', reviews: 29, price: 'K160' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-forest-700 px-6 py-20 text-center">
        <h1 className="font-serif text-5xl text-sage-200 mb-3 leading-tight">
          Learn better.<br />
          <span className="text-gold-200 italic">Pass your exams.</span>
        </h1>
        <p className="text-sage-200 text-base mb-8 opacity-80">
          Zambia&apos;s tutoring platform — built for O-Level and A-Level students.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <Link
            href="/auth/register"
            className="text-sm font-medium px-8 py-3 rounded-xl transition"
            style={{ backgroundColor: '#e8c84a', color: '#1a2a00' }}
          >
            Create a free account →
          </Link>
          <p className="text-xs" style={{ color: '#a8c4a8', opacity: 0.7 }}>
            Already a member?{' '}
            <Link href="/auth/login" style={{ color: '#c9b87a', borderBottom: '1px solid rgba(201,184,122,0.4)' }}>
              Sign in
            </Link>
          </p>
        </div>

        <div className="flex justify-center gap-12 text-sage-200 text-xs tracking-wide">
          <div><span className="block font-serif text-3xl text-sage-200 mb-1">240+</span>Tutors available</div>
          <div><span className="block font-serif text-3xl text-sage-200 mb-1">1,800+</span>Lessons uploaded</div>
          <div><span className="block font-serif text-3xl text-sage-200 mb-1">4.8</span>Average rating</div>
        </div>
      </section>

      {/* Subjects */}
      <section className="px-6 py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="font-serif text-2xl">Browse by subject</h2>
            <Link href="/browse" className="text-sm text-forest-500 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {subjects.map((s) => (
              <Link
                key={s.name}
                href={`/browse?subject=${s.name}`}
                className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:border-gray-300 transition"
              >
                <div className={`w-9 h-9 ${s.bg} ${s.text} rounded-lg flex items-center justify-center text-xs font-medium mx-auto mb-2`}>
                  {s.initials}
                </div>
                <div className="text-xs font-medium text-gray-800">{s.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.count} lessons</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tutors */}
      <section className="px-6 py-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="font-serif text-2xl">Featured tutors</h2>
            <Link href="/tutor" className="text-sm text-forest-500 hover:underline">Browse all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tutors.map((t) => (
              <div key={t.name} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition cursor-pointer">
                <div className="w-12 h-12 bg-sage-100 text-forest-600 rounded-full flex items-center justify-center text-sm font-medium mb-3">
                  {t.initials}
                </div>
                <div className="text-sm font-medium mb-1">{t.name}</div>
                <div className="text-xs text-gray-500 mb-2">{t.subjects}</div>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${t.badgeStyle} mb-2`}>
                  ✓ {t.badge}
                </span>
                <div className="text-xs text-gray-400 mb-3">{t.forms}</div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">★ {t.rating} · {t.reviews} reviews</span>
                  <span className="text-sm font-medium text-forest-600">{t.price}/session</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Prep */}
      <section className="bg-forest-700 px-6 py-14">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-sage-200 mb-2">Exam preparation programs</h2>
          <p className="text-sage-200 text-sm mb-8 opacity-75">Structured bundles built around the Zambian national syllabus.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { level: 'O-Level', name: 'Form 4 Bundle', desc: 'All core subjects · 120+ lessons · Past paper walkthroughs', price: 'K200' },
              { level: 'A-Level', name: 'Form 6 Bundle', desc: 'Sciences, Commerce & Arts · 90+ lessons · Exam strategy guides', price: 'K350' },
              { level: 'Single subject', name: 'Pick & study', desc: 'Focused exam bundles per subject · Ideal for targeted revision', price: 'from K80' },
            ].map((e) => (
              <div key={e.name} className="bg-white/10 border border-white/20 rounded-xl p-5">
                <div className="text-xs tracking-widest text-gold-200 mb-1 uppercase">{e.level}</div>
                <div className="font-serif text-xl text-sage-200 mb-2">{e.name}</div>
                <div className="text-xs text-sage-200 opacity-75 mb-5 leading-relaxed">{e.desc}</div>
                <Link
                  href="/auth/register"
                  className="inline-block text-xs px-4 py-2 rounded-lg transition"
                  style={{ backgroundColor: '#e8c84a', color: '#1a2a00' }}
                >
                  View bundle — {e.price}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-14 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl mb-10">How it works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: '1', title: 'Browse & choose', desc: 'Search by subject, grade, or tutor name' },
              { n: '2', title: 'Buy or book', desc: 'Unlock recorded lessons or book a live session' },
              { n: '3', title: 'Pay with mobile money', desc: 'Secure checkout via Airtel or MTN Money' },
              { n: '4', title: 'Learn & pass', desc: 'Study at your own pace and track progress' },
            ].map((s) => (
              <div key={s.n}>
                <div className="w-10 h-10 bg-sage-100 text-forest-600 rounded-full flex items-center justify-center font-serif text-lg mx-auto mb-3">
                  {s.n}
                </div>
                <div className="text-sm font-medium mb-1">{s.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-5 flex justify-between items-center text-sm text-gray-400">
        <span className="font-serif text-forest-600">Rent a Tutor · Zambia</span>
        <div className="flex gap-6">
          <Link href="/about" className="hover:text-gray-600">About</Link>
          <Link href="/auth/register?role=tutor" className="hover:text-gray-600">Become a tutor</Link>
          <Link href="/contact" className="hover:text-gray-600">Contact</Link>
        </div>
        <span>© 2026 Rent a Tutor</span>
      </footer>
    </div>
  )
}
