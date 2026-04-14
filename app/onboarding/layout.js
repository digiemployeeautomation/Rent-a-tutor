export default function OnboardingLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-forest-600">
          Rent a <span className="text-gold-500 italic">Tutor</span>
        </h1>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
