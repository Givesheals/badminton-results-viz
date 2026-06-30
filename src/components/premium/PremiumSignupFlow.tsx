import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, useState } from 'react'
import type { BePlayerRecord } from '../../data/bePlayerDirectory'
import { BetaBadge } from '../ui/BetaBadge'
import { usePremium } from '../../context/PremiumContext'
import {
  formatPriceGbp,
  planBillingDescription,
  planPriceGbp,
  PREMIUM_MONTHLY_PRICE_GBP,
  PREMIUM_YEARLY_PRICE_GBP,
  PREMIUM_YEARLY_SAVINGS_GBP,
  PREMIUM_VERIFICATION_GRACE_DAYS,
  type PremiumPlan,
} from '../../lib/premiumPricing'
import { BePlayerSearch } from './BePlayerSearch'

type Step = 'value' | 'details' | 'payment' | 'success'

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
  onOpenVerification: (devCode: string) => void
}

const PREMIUM_BENEFITS = [
  'Tournament partners — how far you run together',
  'Partner chemistry & opponent matchups',
  'Tournament progression & category milestones',
  'Player type profile & season journey',
  'Deeper insights from your match history',
]

export function PremiumSignupFlow({ open, onClose, playerName, onOpenVerification }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const { subscribe, checkBeNumber } = usePremium()

  const [step, setStep] = useState<Step>('value')
  const [plan, setPlan] = useState<PremiumPlan>('yearly')
  const [selectedPlayer, setSelectedPlayer] = useState<BePlayerRecord | null>(null)
  const [receiptEmail, setReceiptEmail] = useState('')
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedRenewal, setAgreedRenewal] = useState(false)
  const [agreedBeta, setAgreedBeta] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [lastDevCode, setLastDevCode] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStep('value')
    setPlan('yearly')
    setSelectedPlayer(null)
    setReceiptEmail('')
    setPlayerError(null)
    setEmailError(null)
    setAgreedTerms(false)
    setAgreedRenewal(false)
    setAgreedBeta(false)
    setCardNumber('')
    setCardExpiry('')
    setCardCvc('')
    setLastDevCode(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open, step])

  if (!open) return null

  function validateDetails(): boolean {
    let valid = true
    setPlayerError(null)
    setEmailError(null)

    if (!selectedPlayer) {
      setPlayerError('Search for and select a player from the Badminton England register.')
      valid = false
    } else {
      const check = checkBeNumber(selectedPlayer.beNumber)
      if (check.status === 'taken_by_other') {
        setPlayerError(
          'This player already has an active premium subscription. Contact support if you believe this is wrong.',
        )
        valid = false
      } else if (check.status === 'owned_by_you') {
        setPlayerError('You already have premium for this player. Use Manage subscription in the menu.')
        valid = false
      }
    }

    const email = receiptEmail.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address for receipts.')
      valid = false
    }

    return valid
  }

  function handleSubscribe() {
    if (!selectedPlayer) return
    const code = subscribe({
      playerName: selectedPlayer.name,
      beNumber: selectedPlayer.beNumber,
      receiptEmail,
      plan,
    })
    setLastDevCode(code)
    setStep('success')
  }

  const canPay =
    agreedTerms &&
    agreedRenewal &&
    agreedBeta &&
    cardNumber.replace(/\s/g, '').length >= 12 &&
    cardExpiry.length >= 4 &&
    cardCvc.length >= 3

  const stepTitle: Record<Step, string> = {
    value: 'Premium (Beta)',
    details: 'Your details',
    payment: 'Payment',
    success: 'Welcome to Premium',
  }

  const unlockedName = selectedPlayer?.name ?? ''
  const unlockedBeNumber = selectedPlayer?.beNumber ?? ''
  const unlockedMaskedEmail = selectedPlayer?.maskedEmail ?? ''

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-ink-900/40" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card-frame fixed left-1/2 top-1/2 z-[70] flex max-h-[min(92vh,720px)] w-[min(100vw-2rem,32rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-2 ring-brand-200 outline-none"
      >
        <div className="border-b border-ink-100 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="text-base font-semibold text-ink-900">
              {stepTitle[step]}
            </h2>
            {step !== 'success' && <BetaBadge />}
          </div>
          {step !== 'success' && (
            <p className="mt-1 text-xs text-ink-500">
              Step {step === 'value' ? 1 : step === 'details' ? 2 : 3} of 3
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {step === 'value' && (
            <div className="space-y-5">
              <p className="text-sm text-ink-700">
                Unlock deeper insights from match history — advanced stats, progression tracking,
                and more.
              </p>

              <ul className="space-y-2">
                {PREMIUM_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex gap-2 text-sm text-ink-700">
                    <span className="text-court-600" aria-hidden>
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <p className="font-medium">Private Discord</p>
                <p className="mt-1 text-brand-700">
                  Talk directly to the team and shape the product — available right after you
                  subscribe.
                </p>
              </div>

              <fieldset>
                <legend className="sr-only">Choose a plan</legend>
                <div className="space-y-2">
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 ${
                      plan === 'yearly'
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-ink-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="plan"
                        checked={plan === 'yearly'}
                        onChange={() => setPlan('yearly')}
                        className="text-brand-600"
                      />
                      <div>
                        <p className="font-medium text-ink-900">Yearly</p>
                        <p className="text-xs text-court-700">
                          Save {formatPriceGbp(PREMIUM_YEARLY_SAVINGS_GBP)}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-ink-900">
                      {formatPriceGbp(PREMIUM_YEARLY_PRICE_GBP)}/yr
                    </span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 ${
                      plan === 'monthly'
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-ink-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="plan"
                        checked={plan === 'monthly'}
                        onChange={() => setPlan('monthly')}
                        className="text-brand-600"
                      />
                      <p className="font-medium text-ink-900">Monthly</p>
                    </div>
                    <span className="font-semibold text-ink-900">
                      {formatPriceGbp(PREMIUM_MONTHLY_PRICE_GBP)}/mo
                    </span>
                  </label>
                </div>
              </fieldset>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <BePlayerSearch
                defaultQuery={playerName}
                selected={selectedPlayer}
                onSelect={(player) => {
                  setSelectedPlayer(player)
                  setPlayerError(null)
                }}
                onClear={() => {
                  setSelectedPlayer(null)
                  setPlayerError(null)
                }}
                error={playerError}
              />

              <label className="block text-sm font-medium text-ink-900">
                Receipt email
                <input
                  type="email"
                  autoComplete="email"
                  value={receiptEmail}
                  onChange={(event) => {
                    setReceiptEmail(event.target.value)
                    setEmailError(null)
                  }}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  placeholder="you@example.com"
                />
              </label>
              {emailError && <p className="text-sm text-loss-600">{emailError}</p>}
            </div>
          )}

          {step === 'payment' && selectedPlayer && (
            <div className="space-y-4">
              <div className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm">
                <p className="font-medium text-ink-900">Order summary</p>
                <dl className="mt-2 space-y-1 text-ink-700">
                  <div className="flex justify-between">
                    <dt>Plan</dt>
                    <dd>{planBillingDescription(plan)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Player</dt>
                    <dd>
                      {selectedPlayer.name} ({selectedPlayer.beNumber})
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-ink-200 pt-2 font-semibold text-ink-900">
                    <dt>Total today</dt>
                    <dd>{formatPriceGbp(planPriceGbp(plan))}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-ink-500">Beta pricing — may change</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-ink-900">Card details (simulated)</p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Card number"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(event) => setCardExpiry(event.target.value)}
                    className="rounded-lg border border-ink-200 px-3 py-2 text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="CVC"
                    value={cardCvc}
                    onChange={(event) => setCardCvc(event.target.value)}
                    className="rounded-lg border border-ink-200 px-3 py-2 text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>

              <div className="space-y-2 text-sm text-ink-700">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(event) => setAgreedTerms(event.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I agree to the{' '}
                    <a href="#" className="text-brand-700 hover:underline" onClick={(e) => e.preventDefault()}>
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-brand-700 hover:underline" onClick={(e) => e.preventDefault()}>
                      Privacy Policy
                    </a>
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={agreedRenewal}
                    onChange={(event) => setAgreedRenewal(event.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I understand my subscription auto-renews and I can cancel anytime.
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={agreedBeta}
                    onChange={(event) => setAgreedBeta(event.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I understand this is a beta — features and pricing may change. Your feedback
                    helps us improve.
                  </span>
                </label>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-sm text-ink-700">
              <p className="font-medium text-court-700">
                Premium is active for {unlockedName} (BE {unlockedBeNumber})
              </p>
              <p>Advanced stats are now unlocked for this player on your account.</p>

              <a
                href="https://discord.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl bg-[#5865F2] px-4 py-3 font-semibold text-white hover:bg-[#4752c4]"
              >
                Join private Discord
              </a>

              <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                <p className="font-medium text-brand-900">Activate your subscription</p>
                <p className="mt-1 text-brand-800">
                  We&apos;ve sent a 6-digit activation code to{' '}
                  <strong>{unlockedMaskedEmail}</strong> — the email address registered with
                  Badminton England for this player. Enter that code within{' '}
                  {PREMIUM_VERIFICATION_GRACE_DAYS} days to confirm access and keep premium active.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (lastDevCode) onOpenVerification(lastDevCode)
                  }}
                  className="mt-3 text-sm font-semibold text-brand-700 hover:text-brand-600"
                >
                  Enter activation code →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 px-4 py-3 sm:px-5">
          {step === 'value' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Continue
              </button>
            </>
          )}
          {step === 'details' && (
            <>
              <button
                type="button"
                onClick={() => setStep('value')}
                className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateDetails()) setStep('payment')
                }}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Continue
              </button>
            </>
          )}
          {step === 'payment' && (
            <>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canPay}
                onClick={handleSubscribe}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Subscribe — {planBillingDescription(plan)}
              </button>
            </>
          )}
          {step === 'success' && (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
