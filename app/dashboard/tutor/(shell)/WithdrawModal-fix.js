// PATCH: Replace the WithdrawModal component in
// app/dashboard/tutor/(shell)/page.js
//
// The original handleSubmit validated fields then called setDone(true) with
// no database write. Payout requests were never saved.
// This version inserts into payout_requests before showing success.

function WithdrawModal({ balance, onClose }) {
  const [phone, setPhone]   = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleaned = phone.replace(/\s+/g, '')
    if (!/^(09|07)\d{8}$/.test(cleaned)) {
      setError('Enter a valid Zambian mobile number.')
      return
    }
    const num = parseInt(amount, 10)
    if (isNaN(num) || num < 50)  { setError('Minimum withdrawal is K50.'); return }
    if (num > balance)            { setError(`You only have K${balance} available.`); return }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: tutor }    = await supabase
      .from('tutors').select('id').eq('user_id', user.id).single()

    const { error: dbErr } = await supabase.from('payout_requests').insert({
      tutor_id:     tutor?.id ?? user.id,  // tutors.id (PK)
      amount:       num,
      phone:        cleaned,
      status:       'pending',
      requested_at: new Date().toISOString(),
    })

    setSaving(false)

    if (dbErr) {
      console.error('[WithdrawModal]', dbErr)
      setError('Failed to submit request. Please try again.')
      return
    }

    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget && !saving && !done) onClose() }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg" style={{ color: 'var(--color-primary)' }}>Withdraw earnings</h2>
            {!saving && !done && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Available balance: K{balance.toLocaleString()}</p>
        </div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="text-3xl mb-3">✅</div>
            <p className="text-sm font-medium text-gray-800 mb-1">Withdrawal requested!</p>
            <p className="text-xs text-gray-500 mb-5">
              Your request has been submitted. The admin team will process it within 1–2 business days.
            </p>
            <button onClick={onClose} className="text-sm px-5 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mobile money number</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="0971 234 567"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
              <p className="text-xs text-gray-400 mt-1">Airtel Money, MTN MoMo, or Zamtel Kwacha</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Amount (ZMW)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">K</span>
                <input type="number" required min="50" max={balance} value={amount}
                  onChange={e => setAmount(e.target.value)} placeholder="Minimum K50"
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-sm outline-none focus:border-gray-400" />
              </div>
            </div>
            {error && <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-btn-bg)', color: 'var(--color-btn-text)' }}>
              {saving ? 'Submitting…' : 'Request withdrawal →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
