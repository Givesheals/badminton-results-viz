import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, useState } from 'react'
import type { BePlayerRecord } from '../../data/bePlayerDirectory'
import { BetaBadge } from '../ui/BetaBadge'
import { Modal } from '../ui/Modal'
import { legalPageHref, PRIVACY_POLICY_URL } from '../../lib/legalPages'
import { usePremium } from '../../context/PremiumContext'
import {
  formatPriceGbp,
  PREMIUM_MONTHLY_PRICE_GBP,
  PREMIUM_YEARLY_PRICE_GBP,
  PREMIUM_YEARLY_SAVINGS_GBP,
  type PremiumPlan,
} from '../../lib/premiumPricing'
import type { StoredPremiumState } from '../../lib/premiumStorage'
import { BePlayerSearch } from './BePlayerSearch'
import { PremiumShowcaseCarousel } from './PremiumShowcaseCarousel'

type Step = 'value' | 'details' | 'payment' | 'success'

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
  /** Pre-select plan when opened from settings (or elsewhere). */
  initialPlan?: PremiumPlan
  /**
   * Called once payment succeeds. When provided, the flow closes itself and the parent
   * shows the welcome modal instead of the built-in success step.
   */
  onSubscribed?: (subscription: StoredPremiumState) => void
}

const PREMIUM_BENEFITS = [
  'Tournament recaps & weekend performance',
  'Partner chemistry & opponent matchups',
  'Category milestones & tournament progression tracker',
  'Personal notes',
]

export function PremiumSignupFlow({
  open,
  onClose,
  playerName,
  initialPlan = 'yearly',
  onSubscribed,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const { subscribe, checkBeNumber } = usePremium()

  const [step, setStep] = useState<Step>('value')
  const [plan, setPlan] = useState<PremiumPlan>(initialPlan)
  const [selectedPlayer, setSelectedPlayer] = useState<BePlayerRecord | null>(null)
  const [receiptEmail, setReceiptEmail] = useState('')
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedImmediateStart, setAgreedImmediateStart] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep('value')
    setPlan(initialPlan)
    setSelectedPlayer(null)
    setReceiptEmail('')
    setPlayerError(null)
    setEmailError(null)
    setAgreedTerms(false)
    setAgreedImmediateStart(false)
  }, [open, initialPlan])

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
      setPlayerError('Search for and select a BadmInfo player profile.')
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
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address for receipts.')
      valid = false
    }

    return valid
  }

  function handleSubscribe() {
    if (!selectedPlayer) return
    const resolvedReceiptEmail =
      receiptEmail.trim() || selectedPlayer.maskedEmail
    subscribe({
      playerName: selectedPlayer.name,
      beNumber: selectedPlayer.beNumber,
      receiptEmail: resolvedReceiptEmail,
      plan,
    })
    if (onSubscribed) {
      onSubscribed({
        playerName: selectedPlayer.name,
        beNumber: selectedPlayer.beNumber.trim(),
        receiptEmail: resolvedReceiptEmail.trim(),
        plan,
        subscribedAt: new Date().toISOString(),
      })
      onClose()
      return
    }
    setStep('success')
  }

  const canPay = agreedTerms && agreedImmediateStart

  const stepTitle: Record<Step, string> = {
    value: 'Premium (Beta)',
    details: 'Your details',
    payment: 'Legal agreement',
    success: 'Welcome to Premium',
  }

  const unlockedName = selectedPlayer?.name ?? ''
  const unlockedBeNumber = selectedPlayer?.beNumber ?? ''

  if (step === 'payment') {
    return (
      <Modal
        open
        onClose={onClose}
        title={stepTitle.payment}
        showHeaderClose
        frame="plain"
        layer="top"
        footer={
          <>
            <button
              type="button"
              onClick={() => setStep('details')}
              className="rounded-sm border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-900 transition hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!canPay}
              onClick={handleSubscribe}
              className="rounded-sm bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Agree &amp; Pay
            </button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-ink-700">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(event) => setAgreedTerms(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to the{' '}
              <a
                href={legalPageHref('premium-terms')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-badminfo-link underline underline-offset-2 hover:opacity-80"
              >
                BadmInfo Premium Terms
              </a>
              .
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreedImmediateStart}
              onChange={(event) => setAgreedImmediateStart(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              I want Premium access to start immediately and understand that, once it starts, I
              will lose my 14-day right to cancel.
            </span>
          </label>
          <p>
            See our{' '}
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-badminfo-link underline underline-offset-2 hover:opacity-80"
            >
              Privacy Policy
            </a>{' '}
            for information about how we use your personal data.
          </p>
        </div>
      </Modal>
    )
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-ink-900/40" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`card-frame fixed left-1/2 top-1/2 z-[70] flex max-h-[min(92vh,720px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-2 ring-brand-200 outline-none ${
          step === 'value'
            ? 'w-[min(100vw-2rem,42rem)]'
            : 'w-[min(100vw-2rem,32rem)]'
        }`}
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
              <PremiumShowcaseCarousel />

              <p className="text-sm text-ink-700">
                Unlock deeper insights from your match history — analytics, progression, and
                tools to prepare for your next game.
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

              <p className="text-xs text-ink-500">
                Beta subscribers also get access to a private Discord for feedback.
              </p>

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

              <p className="text-xs text-ink-500">
                Cancel anytime. Your Premium access will continue until the end of your current paid
                period.
              </p>
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
                Receipt email{' '}
                <span className="font-normal text-ink-500">(optional)</span>
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
              <p className="text-xs text-ink-500">
                {selectedPlayer
                  ? `Leave blank to send receipts to your Badminton England email (${selectedPlayer.maskedEmail}).`
                  : 'Leave blank to send receipts to the email on your Badminton England record.'}
              </p>
              {emailError && <p className="text-sm text-loss-600">{emailError}</p>}
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
                className="flex w-full items-center justify-center rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                Join private Discord
              </a>
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
