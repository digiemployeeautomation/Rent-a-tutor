import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between">
      <Link href="/" className="font-serif text-xl text-forest-600">
        Rent a <span className="text-gold-500 italic">Tutor</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
        <Link href="/browse" className="hover:text-gray-900">Browse lessons</Link>
        <Link href="/tutor" className="hover:text-gray-900">Find a tutor</Link>
        <Link href="/exam-prep" className="hover:text-gray-900">Exam prep</Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/auth/login"
          className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Log in
        </Link>
        <Link
          href="/auth/register"
          className="text-sm px-4 py-2 bg-forest-600 text-sage-200 rounded-lg hover:bg-forest-700"
        >
          Get started
        </Link>
      </div>
    </nav>
  )
}
