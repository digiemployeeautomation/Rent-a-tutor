'use client'

import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'

// Plan definitions
const PLANS = [
  {
    id: 'subject',
    label: 'Per Subject',
    accessLabel: (subjectName, formName, termName) =>
      `${subjectName} — ${formName}, ${termName}`,
    billing: [{ type: 'monthly', label: 'Monthly', price: 50 }],
    duration: '1 month access',
  },
  {
    id: 'term',
    label: 'Per Term',
    accessLabel: (_subjectName, formName, termName) =>
      `All subjects — ${formName}, ${termName}`,
    billing: [
      { type: 'monthly', label: 'Monthly', price: 150 },
      { type: 'one_time', label: 'One-time', price: 500 },
    ],
    duration: '4 months access',
  },
  {
    id: 'form',
    label: 'Per Form',
    accessLabel: (_subjectName, formName, _termName) =>
      `All subjects — ${formName}, all terms`,
    billing: [
      { type: 'monthly', label: 'Monthly', price: 300 },
      { type: 'one_time', label: 'One-time', price: 3000 },
    ],
    duration: '12 months access',
  },
]

const NETWORKS = [
  { id: 'airtel', label: 'Airtel Money' },
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'zamtel', label: 'Zamtel Kwacha' },
]

// Polling config
const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS = 80000

function formatPrice(price) {
  return `K${price.toLocaleString()}`
}

export default function Paywall({
  subjectName,
  formName,
  termName,
  subjectId,
  formId,
  termId,
  onSubscribed,
}) {
  // Step: 'select' | 'pay' | 'processing' | 'success' | 'error'
  const [step, setStep] = useState('select')

  // Plan selection
  const [selectedPlanId, setSelectedPlanId] = useState('subject')
  const [billingType, setBillingType] = useState('monthly')

  // Payment details
  const [network, setNetwork] = useState(null)
  const [phone, setPhone] = useState('')

  // Transaction state
  const [transactionId, setTransactionId] = useState(null)
  const [amount, setAmount] = useState(null)

  // Error / loading
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId)
  const activeBilling = selectedPlan.billing.find((b) => b.type === billingType) ?? selectedPlan.billing[0]

  function handlePlanChange(planId) {
    setSelectedPlanId(planId)
    // Reset billing type to monthly when switching plans
    setBillingType('monthly')
  }

  async function handlePayRequest() {
    if (!network) {
      setErrorMsg('Please select a payment network.')
      return
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your phone number.')
      return
    }

    setErrorMsg('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/subscription/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          planType: selectedPlanId,
          subjectId: selectedPlanId === 'subject' ? subjectId : undefined,
          formId,
          termId: selectedPlanId === 'form' ? undefined : termId,
          billingType: activeBilling.type,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Payment request failed. Please try again.')
        setIsLoading(false)
        return
      }

      setTransactionId(data.transactionId)
      setAmount(data.amount)
      setStep('processing')
      setIsLoading(false)
      startPolling(data.transactionId, data.planType, data.subjectId, data.formId, data.termId, data.billingType, data.amount)
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setIsLoading(false)
    }
  }

  function startPolling(txId, planType, sId, fId, tId, billing, amt) {
    const startTime = Date.now()

    const pollId = setInterval(async () => {
      if (Date.now() - startTime >= POLL_TIMEOUT_MS) {
        clearInterval(pollId)
        setErrorMsg('Payment confirmation timed out. If you were charged, contact support.')
        setStep('error')
        return
      }

      try {
        const res = await fetch('/api/subscription/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: txId,
            planType,
            subjectId: sId,
            formId: fId,
            termId: tId,
            billingType: billing,
            amount: amt,
          }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          clearInterval(pollId)
          setStep('success')
          setTimeout(() => onSubscribed?.(), 2000)
          return
        }

        if (res.ok && data.status === 'failed') {
          clearInterval(pollId)
          setErrorMsg(data.error ?? 'Payment was declined. Please try again.')
          setStep('error')
        }
        // status === 'pending' — keep polling
      } catch {
        // Network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS)
  }

  function handleRetry() {
    setStep('pay')
    setErrorMsg('')
    setTransactionId(null)
    setAmount(null)
  }

  // ── STEP: success ──────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-green-200 bg-white p-10 shadow-sm text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Subscription activated!</h2>
        <p className="text-gray-500">Loading your content…</p>
      </div>
    )
  }

  // ── STEP: processing ───────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white p-10 shadow-sm text-center">
        <svg
          className="h-10 w-10 animate-spin text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-base font-medium text-gray-700">Waiting for payment confirmation…</p>
        <p className="text-sm text-gray-400">Check your phone and approve the {formatPrice(amount)} prompt.</p>
      </div>
    )
  }

  // ── STEP: error ────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-white p-10 shadow-sm text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Payment failed</h2>
        <p className="text-sm text-gray-500 max-w-sm">{errorMsg}</p>
        <button
          onClick={handleRetry}
          className="mt-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  // ── STEP: select ──────────────────────────────────────────────────────────
  if (step === 'select') {
    return (
      <BottomSheet open onClose={() => {}}>
        {/* Header */}
        <div className="flex flex-col items-center gap-3 pb-6 text-center border-b border-gray-100 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Subscribe to unlock this content</h2>
            <p className="mt-1 text-sm text-gray-500">
              {subjectName} · {formName} · {termName}
            </p>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-3 mb-4 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const primaryBilling = plan.billing[0]
            const isSelected = selectedPlanId === plan.id
            const isPopular = plan.id === 'term'
            return (
              <button
                key={plan.id}
                onClick={() => handlePlanChange(plan.id)}
                className={`relative flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-2.5 left-3 rounded-full bg-pink-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                    Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                    {plan.label}
                  </span>
                  <span
                    className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  {plan.accessLabel(subjectName, formName, termName)}
                </p>
                <div className="mt-auto pt-2">
                  <span className={`text-lg font-bold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                    {formatPrice(primaryBilling.price)}
                  </span>
                  <span className="text-xs text-gray-400">/mo</span>
                  {plan.billing.length > 1 && (
                    <p className="text-xs text-pink-600 font-medium mt-0.5">
                      or {formatPrice(plan.billing[1].price)} one-time
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{plan.duration}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Billing toggle (Term / Form plans only) */}
        {selectedPlan.billing.length > 1 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Billing:</span>
            {selectedPlan.billing.map((b) => (
              <button
                key={b.type}
                onClick={() => setBillingType(b.type)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  billingType === b.type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {b.label} — {formatPrice(b.price)}
              </button>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => setStep('pay')}
          className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          Continue with {selectedPlan.label} — {formatPrice(activeBilling.price)}
          {activeBilling.type === 'monthly' ? '/mo' : ' one-time'}
        </button>
      </BottomSheet>
    )
  }

  // ── STEP: pay ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
        <button
          onClick={() => { setStep('select'); setErrorMsg('') }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Back"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-base font-semibold text-gray-800">Payment details</h2>
          <p className="text-xs text-gray-400">
            {selectedPlan.label} · {formatPrice(activeBilling.price)}
            {activeBilling.type === 'monthly' ? '/month' : ' one-time'}
          </p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Network selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Select network
          </label>
          <div className="grid grid-cols-3 gap-3">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                onClick={() => setNetwork(n.id)}
                className={`rounded-lg border-2 py-3 px-2 text-center text-sm font-medium transition-colors ${
                  network === n.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone number */}
        <div>
          <label htmlFor="paywall-phone" className="mb-2 block text-sm font-medium text-gray-700">
            Mobile money number
          </label>
          <input
            id="paywall-phone"
            type="tel"
            inputMode="numeric"
            placeholder="09XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition"
          />
        </div>

        {/* Error */}
        {errorMsg && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMsg}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handlePayRequest}
          disabled={isLoading}
          className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending request…
            </span>
          ) : (
            `Pay ${formatPrice(activeBilling.price)}`
          )}
        </button>
      </div>
    </div>
  )
}
