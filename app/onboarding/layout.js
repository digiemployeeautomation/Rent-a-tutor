export default function OnboardingLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-blue-600">
          Rent<span className="text-pink-400 italic">a</span>Tutor
        </h1>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
