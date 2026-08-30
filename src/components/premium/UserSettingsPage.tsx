import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { usePremium } from '../../context/PremiumContext'
import {
  formatPriceGbp,
  planBillingDescription,
  planLabel,
  PREMIUM_MONTHLY_PRICE_GBP,
  PREMIUM_YEARLY_PRICE_GBP,
  PREMIUM_YEARLY_SAVINGS_GBP,
  type PremiumPlan,
} from '../../lib/premiumPricing'
import type { StoredPremiumState } from '../../lib/premiumStorage'
import { BetaBadge } from '../ui/BetaBadge'

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
  onSignUpPremium: (plan?: PremiumPlan) => void
  onManageSubscription: () => void
}

type SettingsTab = 'general' | 'favourites' | 'notifications' | 'premium'

type DemoView =
  | 'unsubscribed'
  | 'signup_incomplete'
  | 'active'
  | 'processing'
  | 'payment_failed'
  | 'renewal_failed'
  | 'cancelled'
  | 'cancelled_ended'

type BillingStatus = Exclude<DemoView, 'unsubscribed'>
type StatusTone = 'active' | 'idle' | 'wait' | 'danger' | 'cancelled'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'favourites', label: 'Faves' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'premium', label: 'Premium' },
]

const DEMO_VIEWS: { id: DemoView; label: string }[] = [
  { id: 'unsubscribed', label: 'Inactive' },
  { id: 'signup_incomplete', label: 'Finish signup' },
  { id: 'active', label: 'Active' },
  { id: 'processing', label: 'Processing' },
  { id: 'payment_failed', label: 'Payment failed' },
  { id: 'renewal_failed', label: 'Renewal failed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'cancelled_ended', label: 'Ended' },
]

const PILL_TONE: Record<
  StatusTone,
  { wrap: string; dot: string }
> = {
  active: {
    wrap: 'bg-court-50 text-court-700 ring-1 ring-court-200',
    dot: 'bg-court-600',
  },
  idle: {
    wrap: 'bg-ink-100 text-ink-600 ring-1 ring-ink-200',
    dot: 'bg-ink-400',
  },
  wait: {
    wrap: 'bg-[#fbf6e4] text-[#7a6a12] ring-1 ring-shuttle-400',
    dot: 'bg-shuttle-500',
  },
  danger: {
    wrap: 'bg-loss-50 text-loss-700 ring-1 ring-loss-100',
    dot: 'bg-loss-600',
  },
  cancelled: {
    wrap: 'bg-ink-100 text-ink-700 ring-1 ring-ink-200',
    dot: 'bg-ink-500',
  },
}

/** Value-led pitch lines: what you get, not just what the feature is. */
const PREMIUM_PITCH_BENEFITS: { title: string; value: string }[] = [
  {
    title: 'Personal notes',
    value:
      'Capture what worked - and we surface those notes again the next time you draw that player or pair. Get a tactical head start next time.',
  },
  {
    title: 'Analytics',
    value:
      'See how your results really trend over time with powerful analytics.',
  },
  {
    title: 'Draw Companion',
    value:
      'See your most likely path to the final: the probability of every opponent, your notes on them, and every time you’ve played them before.',
  },
  {
    title: 'Tournament recaps',
    value:
      'Relive the weekend - the results, the run, the story worth keeping. See how your performance tracks against your personal best.',
  },
]

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
      <path d="M3.5 2.75c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h8.5c.69 0 1.25-.56 1.25-1.25V9.5a.75.75 0 0 0-1.5 0v2.75h-8.5v-8.5H6.5a.75.75 0 0 0 0-1.5h-3Z" />
    </svg>
  )
}

function formatDisplayDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function addDaysIso(days: number, from = new Date()): string {
  const next = new Date(from)
  next.setDate(next.getDate() + days)
  return next.toISOString()
}

function nextRenewalIso(subscribedAt: string, plan: PremiumPlan): string {
  const start = new Date(subscribedAt)
  if (Number.isNaN(start.getTime())) return new Date().toISOString()
  const next = new Date(start)
  const now = new Date()
  while (next <= now) {
    if (plan === 'monthly') next.setMonth(next.getMonth() + 1)
    else next.setFullYear(next.getFullYear() + 1)
  }
  return next.toISOString()
}

function buildDemoPremium(playerName: string, status: BillingStatus): StoredPremiumState {
  const justNow = new Date().toISOString()
  const monthly: PremiumPlan = 'monthly'
  const yearly: PremiumPlan = 'yearly'
  const planByStatus: Record<BillingStatus, PremiumPlan> = {
    signup_incomplete: yearly,
    active: yearly,
    processing: monthly,
    payment_failed: monthly,
    renewal_failed: monthly,
    cancelled: yearly,
    cancelled_ended: monthly,
  }
  const startedNow =
    status === 'signup_incomplete' || status === 'processing' || status === 'payment_failed'
  return {
    playerName,
    beNumber: '1206628',
    receiptEmail: 'demo@badminfo.example',
    plan: planByStatus[status],
    subscribedAt: startedNow ? justNow : '2025-03-03T12:00:00.000Z',
  }
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-1.5">
      <dt className="text-sm font-semibold text-ink-900">{label}</dt>
      <dd className="text-sm font-medium text-brand-700">{children}</dd>
    </div>
  )
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const style = PILL_TONE[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.wrap}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {label}
    </span>
  )
}

function statusPresentation(
  status: BillingStatus,
  plan: PremiumPlan,
  retryUntilIso: string,
  periodEndIso: string,
): {
  pillLabel: string
  tone: StatusTone
  message: string | null
  box: 'none' | 'wait' | 'danger' | 'neutral'
  action: 'none' | 'payment' | 'renew' | 'keep' | 'manage' | 'complete'
  actionLabel: string
  dateRow: { label: string; value: string } | null
} {
  const planWord = plan === 'yearly' ? 'yearly' : 'monthly'
  const retryUntil = formatDisplayDate(retryUntilIso)
  const periodEnd = formatDisplayDate(periodEndIso)

  switch (status) {
    case 'active':
      return {
        pillLabel: 'Active',
        tone: 'active',
        message: null,
        box: 'none',
        action: 'manage',
        actionLabel: 'Manage subscription',
        dateRow: { label: 'Next renews', value: '' },
      }
    case 'signup_incomplete':
      return {
        pillLabel: 'Incomplete',
        tone: 'wait',
        message:
          'You’ve set up Premium on BadmInfo, but payment isn’t finished yet. Complete signup in Stripe to start Premium.',
        box: 'wait',
        action: 'complete',
        actionLabel: 'Complete signup',
        dateRow: null,
      }
    case 'processing':
      return {
        pillLabel: 'Processing',
        tone: 'wait',
        message:
          'We’re confirming your payment. You don’t need to do anything. This usually takes a few moments. Premium starts as soon as it goes through.',
        box: 'wait',
        action: 'none',
        actionLabel: '',
        dateRow: null,
      }
    case 'payment_failed':
      return {
        pillLabel: 'Payment failed',
        tone: 'danger',
        message:
          'Your payment didn’t go through, so Premium hasn’t started. You can retry or change how you pay.',
        box: 'danger',
        action: 'payment',
        actionLabel: 'Manage payment',
        dateRow: null,
      }
    case 'renewal_failed':
      return {
        pillLabel: 'Payment failed',
        tone: 'danger',
        message: `Your ${planWord} renewal didn’t go through. Premium still works for now. If this isn’t sorted by ${retryUntil}, you’ll lose access on that date.`,
        box: 'danger',
        action: 'payment',
        actionLabel: 'Manage payment',
        dateRow: { label: 'Access until', value: retryUntil },
      }
    case 'cancelled':
      return {
        pillLabel: 'Cancelled',
        tone: 'cancelled',
        message: `Your subscription is cancelled. You still have Premium until ${periodEnd}. After that, access will stop.`,
        box: 'neutral',
        action: 'keep',
        actionLabel: 'Keep Premium',
        dateRow: { label: 'Access until', value: periodEnd },
      }
    case 'cancelled_ended':
      return {
        pillLabel: 'Cancelled',
        tone: 'cancelled',
        message: 'Your subscription is cancelled. Renew anytime to get Premium back.',
        box: 'neutral',
        action: 'renew',
        actionLabel: 'Renew',
        dateRow: { label: 'Ended', value: '' },
      }
  }
}

const STATUS_BOX: Record<'wait' | 'danger' | 'neutral', string> = {
  wait: 'border-[#ead98a] bg-[#fbf6e4]',
  danger: 'border-loss-100 bg-loss-50',
  neutral: 'border-ink-200 bg-ink-50',
}

export function UserSettingsPage({
  open,
  onClose,
  playerName,
  onSignUpPremium,
  onManageSubscription,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const { premium, isSubscribed } = usePremium()
  const [activeTab, setActiveTab] = useState<SettingsTab>('premium')
  const [demoView, setDemoView] = useState<DemoView>('unsubscribed')

  useEffect(() => {
    if (!open) return
    setActiveTab('premium')
    setDemoView(isSubscribed ? 'active' : 'unsubscribed')
  }, [open, isSubscribed])

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
  }, [open])

  if (!open) return null

  const showAccount = demoView !== 'unsubscribed'
  const billingStatus: BillingStatus = showAccount ? demoView : 'active'
  const displayPremium =
    premium && demoView === 'active'
      ? premium
      : showAccount
        ? buildDemoPremium(playerName, billingStatus)
        : null
  const coveredPlayers = displayPremium
    ? [{ name: displayPremium.playerName, beNumber: displayPremium.beNumber }]
    : []

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-[#f3f0f8] outline-none"
    >
      <header className="border-b border-ink-200 bg-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 id={titleId} className="text-base font-semibold text-ink-900">
              User Settings
            </h1>
            <p className="text-xs text-ink-500">
              Premium account management prototype — other tabs are inert shells
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close user settings"
          >
            ✕
          </button>
        </div>

        <div className="mt-3">
          <span className="text-xs font-medium text-ink-500">Demo status:</span>
          <div
            role="group"
            aria-label="Premium subscription demo state"
            className="mt-1.5 flex flex-wrap gap-1"
          >
            {DEMO_VIEWS.map((option) => {
              const selected = demoView === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDemoView(option.id)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition ${
                    selected
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-white text-ink-600 ring-ink-200 hover:text-ink-900'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-ink-200 bg-white shadow-sm">
          <div className="px-5 pt-4 sm:px-6 sm:pt-5">
            <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">User Settings</h2>

            <nav
              className="mt-3 flex gap-1 overflow-x-auto border-b border-ink-200"
              aria-label="Settings sections"
            >
              {TABS.map((tab) => {
                const selected = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition ${
                      selected
                        ? 'border-ink-900 text-ink-900'
                        : 'border-transparent text-brand-700 hover:text-brand-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="px-5 py-4 sm:px-6 sm:py-4">
            {activeTab === 'premium' ? (
              showAccount && displayPremium ? (
                <SubscribedPremiumTab
                  premium={displayPremium}
                  billingStatus={billingStatus}
                  coveredPlayers={coveredPlayers}
                  onManageSubscription={onManageSubscription}
                  onRenew={() => onSignUpPremium(displayPremium.plan)}
                />
              ) : (
                <UnsubscribedPremiumTab onSignUpPremium={onSignUpPremium} />
              )
            ) : (
              <p className="py-10 text-center text-sm text-ink-400">
                This tab is shown for layout only — nothing to configure in the prototype.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function SubscribedPremiumTab({
  premium,
  billingStatus,
  coveredPlayers,
  onManageSubscription,
  onRenew,
}: {
  premium: StoredPremiumState
  billingStatus: BillingStatus
  coveredPlayers: { name: string; beNumber: string }[]
  onManageSubscription: () => void
  onRenew: () => void
}) {
  const nextRenews = nextRenewalIso(premium.subscribedAt, premium.plan)
  const retryUntilIso = addDaysIso(10)
  const view = statusPresentation(billingStatus, premium.plan, retryUntilIso, nextRenews)

  let dateValue = view.dateRow?.value ?? ''
  if (billingStatus === 'active') dateValue = formatDisplayDate(nextRenews)
  if (billingStatus === 'cancelled_ended') dateValue = formatDisplayDate(addDaysIso(-5))

  function handleAction() {
    if (view.action === 'renew' || view.action === 'complete') onRenew()
    else onManageSubscription()
  }

  const boxHasButton =
    view.action === 'payment' ||
    view.action === 'renew' ||
    view.action === 'keep' ||
    view.action === 'complete'

  const showStartedLabel =
    billingStatus === 'signup_incomplete' ||
    billingStatus === 'processing' ||
    billingStatus === 'payment_failed'

  return (
    <div>
      <h3 className="text-base font-bold text-ink-900">Premium</h3>
      <p className="mt-0.5 text-sm text-ink-500">Your BadmInfo Premium account</p>

      <dl className="mt-2.5 divide-y divide-ink-100 border-t border-ink-100">
        <div>
          <DetailRow label="Status">
            <StatusPill label={view.pillLabel} tone={view.tone} />
          </DetailRow>
          {view.message && view.box !== 'none' ? (
            <div className={`mb-2.5 rounded-lg border px-3 py-2.5 ${STATUS_BOX[view.box]}`}>
              <p className="text-sm text-ink-800">{view.message}</p>
              {boxHasButton ? (
                <button
                  type="button"
                  onClick={handleAction}
                  className={`mt-2.5 inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold text-white ${
                    view.action === 'payment'
                      ? 'bg-loss-600 hover:bg-loss-700'
                      : 'bg-brand-600 hover:bg-brand-700'
                  }`}
                >
                  {view.actionLabel}
                  <ExternalLinkIcon />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <DetailRow label="Plan">
          {planLabel(premium.plan)}
          <span className="ml-1.5 font-normal text-ink-500">
            · {planBillingDescription(premium.plan)}
          </span>
        </DetailRow>
        {view.dateRow ? (
          <DetailRow label={view.dateRow.label}>{dateValue || view.dateRow.value}</DetailRow>
        ) : null}
        {showStartedLabel ? (
          <DetailRow label="Started">{formatDisplayDate(premium.subscribedAt)}</DetailRow>
        ) : (
          <DetailRow label="Subscribed since">{formatDisplayDate(premium.subscribedAt)}</DetailRow>
        )}
      </dl>

      <div className="mt-3 border-t border-ink-100 pt-3">
        <h4 className="text-sm font-bold text-ink-900">Covered players</h4>
        <p className="mt-0.5 text-xs text-ink-500">
          Players this subscription covers (by Badminton England number).
        </p>
        <div className="mt-2 overflow-x-auto rounded-lg border border-ink-100">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-[#f6f2fa] text-xs font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-3 py-1.5 font-semibold">Name</th>
                <th className="px-3 py-1.5 font-semibold">BE Number</th>
              </tr>
            </thead>
            <tbody>
              {coveredPlayers.map((player) => (
                <tr key={player.beNumber} className="border-b border-ink-50 last:border-0">
                  <td className="px-3 py-1.5 font-medium text-brand-700">{player.name}</td>
                  <td className="px-3 py-1.5 text-ink-700">{player.beNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {view.action === 'manage' ? (
        <div className="mt-3 border-t border-ink-100 pt-3">
          <button
            type="button"
            onClick={onManageSubscription}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Manage subscription
            <ExternalLinkIcon />
          </button>
          <p className="mt-1 text-xs text-ink-500">
            Opens the Stripe Customer Portal (cancel, change plan, payment details).
          </p>
        </div>
      ) : null}
    </div>
  )
}

function UnsubscribedPremiumTab({
  onSignUpPremium,
}: {
  onSignUpPremium: (plan: PremiumPlan) => void
}) {
  const [plan, setPlan] = useState<PremiumPlan>('yearly')

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-bold text-ink-900">Premium</h3>
        <BetaBadge />
      </div>
      <p className="text-sm text-ink-500">Get more from BadmInfo</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 py-3">
        <span className="text-sm font-semibold text-ink-900">Status</span>
        <StatusPill label="Inactive" tone="idle" />
      </div>

      {/* CTA above the fold — primary action before benefits or scrolling */}
      <div className="border-t border-ink-100 pt-5">
        <fieldset>
          <legend className="sr-only">Choose a plan</legend>
          <div className="space-y-2">
            <label
              className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 ${
                plan === 'yearly' ? 'border-brand-500 bg-brand-50' : 'border-ink-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="premium-settings-plan"
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
                plan === 'monthly' ? 'border-brand-500 bg-brand-50' : 'border-ink-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="premium-settings-plan"
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

        <p className="mt-3 text-xs text-ink-500">
          Cancel anytime. Your Premium access will continue until the end of your current paid
          period.
        </p>

        <button
          type="button"
          onClick={() => onSignUpPremium(plan)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          Subscribe to Premium
          <BetaBadge />
        </button>
      </div>

      <div className="mt-6 border-t border-ink-100 pt-5">
        <h4 className="text-sm font-bold text-ink-900">What you get</h4>
        <ul className="mt-3 space-y-3.5">
          {PREMIUM_PITCH_BENEFITS.map((benefit) => (
            <li key={benefit.title} className="flex gap-2.5">
              <span className="mt-0.5 shrink-0 font-bold text-brand-600" aria-hidden>
                ✓
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{benefit.title}</p>
                <p className="mt-0.5 text-sm text-ink-600">{benefit.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
