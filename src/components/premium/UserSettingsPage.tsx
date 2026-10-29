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
import { legalPageHref } from '../../lib/legalPages'
import { PREMIUM_PITCH_BENEFITS, PREMIUM_PITCH_TAGLINE } from './premiumPitch'

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
  onSignUpPremium: (plan?: PremiumPlan) => void
  onManageSubscription: () => void
  /** Opens the post-subscribe welcome modal (demo trigger). */
  onShowWelcome: (premium: StoredPremiumState) => void
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

/** Shared width steps for the settings card and the prototype toolbar above it. */
const SETTINGS_FRAME =
  'mx-auto w-full max-w-xl min-[720px]:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl'

const PILL_TONE: Record<
  StatusTone,
  { wrap: string; dot: string }
> = {
  active: {
    wrap: 'bg-court-50 text-court-700 ring-1 ring-court-200',
    dot: 'bg-court-600',
  },
  idle: {
    wrap: 'bg-[#ececef] text-[#5c616c]',
    dot: 'bg-[#6b707a]',
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
    <div className="col-span-2 grid grid-cols-subgrid items-baseline gap-x-4 border-t border-ink-100 py-1.5">
      <dt className="text-sm font-semibold text-ink-900">{label}</dt>
      {/* Regular, not medium: Segoe UI on Windows draws 500 as semibold, so values matched the labels. */}
      <dd className="whitespace-nowrap text-right text-sm font-normal text-ink-900">{children}</dd>
    </div>
  )
}

/** Quiet legal link shared by every Premium settings layout. */
function PremiumTermsFooter() {
  return (
    <p className="mt-6 border-t border-[#ececf1] pt-4 text-[13px] text-ink-600">
      <a
        href={legalPageHref('premium-terms')}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-ink-900"
      >
        BadmInfo Premium Terms
      </a>
    </p>
  )
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const style = PILL_TONE[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.wrap}`}>
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
  onShowWelcome,
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
      className="fixed inset-0 z-50 overflow-y-auto bg-white outline-none"
    >
      <div className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <header className="mb-4">
        <div className={SETTINGS_FRAME}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 id={titleId} className="text-base font-semibold text-ink-900">
              User Settings
            </h1>
            <p className="text-xs text-ink-500">
              Premium account management prototype - other tabs are inert shells
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
            <button
              type="button"
              onClick={() =>
                onShowWelcome(
                  premium
                    ? { ...premium, subscribedAt: new Date().toISOString() }
                    : buildDemoPremium(playerName, 'signup_incomplete'),
                )
              }
              className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-600 ring-1 ring-ink-200 transition hover:text-ink-900"
            >
              Complete
            </button>
          </div>
        </div>
        </div>
      </header>

        <div className={`${SETTINGS_FRAME} overflow-hidden rounded-xl border border-[#e4e4ea] bg-white shadow-sm`}>
          <div className="bg-[#f2f3f5] px-5 py-4 sm:px-6 sm:py-5 lg:px-8 xl:px-10">
            <h2 className="text-xl font-bold text-ink-900">User Settings</h2>
          </div>

          <div className="bg-white px-5 sm:px-6 lg:px-8 xl:px-10">
            <nav
              className="flex gap-5 border-b border-[#e6e6ea] sm:gap-7"
              aria-label="Settings sections"
            >
              {TABS.map((tab) => {
                const selected = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`-mb-px shrink-0 border-b-2 px-0.5 pb-2.5 pt-2 text-sm transition ${
                      selected
                        ? 'border-ink-900 font-bold text-ink-900'
                        : 'border-transparent font-semibold text-badminfo-link hover:text-[#4a287d]'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 xl:px-10 xl:py-8">
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

  const actionButtonClass =
    view.action === 'payment'
      ? 'bg-loss-600 hover:bg-loss-700 focus-visible:ring-loss-600'
      : 'bg-badminfo-link hover:bg-[#4a287d] focus-visible:ring-badminfo-link'

  return (
    <div>
      <div className="flex flex-col gap-y-5 min-[720px]:grid min-[720px]:grid-cols-[minmax(16rem,1fr)_19.25rem] min-[720px]:items-start min-[720px]:gap-x-6 min-[720px]:gap-y-0 lg:flex lg:max-w-4xl lg:flex-row lg:gap-x-16">
        <div className="w-full min-w-0 lg:w-96 lg:shrink-0">
          <h3 className="text-lg font-bold text-ink-900">Premium</h3>
          <p className="mt-0.5 text-sm text-ink-500">Your BadmInfo Premium account</p>

          {view.message && view.box !== 'none' ? (
            <div className={`mt-4 rounded-lg border px-3 py-2.5 ${STATUS_BOX[view.box]}`}>
              <p className="text-sm leading-relaxed text-ink-800">{view.message}</p>
              {boxHasButton ? (
                <button
                  type="button"
                  onClick={handleAction}
                  className={`mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${actionButtonClass}`}
                >
                  {view.actionLabel}
                  <ExternalLinkIcon />
                </button>
              ) : null}
            </div>
          ) : null}

          <dl className="mt-4 grid grid-cols-[max-content_minmax(0,1fr)]">
            <div className="col-span-2 grid grid-cols-subgrid items-center gap-x-4 border-t border-ink-100 py-1.5">
              <span className="text-sm font-semibold text-ink-900">Status</span>
              <span className="text-right">
                <StatusPill label={view.pillLabel} tone={view.tone} />
              </span>
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

          {view.action === 'manage' ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={onManageSubscription}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-badminfo-link px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4a287d] focus:outline-none focus-visible:ring-2 focus-visible:ring-badminfo-link focus-visible:ring-offset-2"
              >
                Manage subscription
                <ExternalLinkIcon />
              </button>
              <p className="mt-1.5 text-xs text-ink-500">
                Opens the Stripe Customer Portal (cancel, change plan, payment details).
              </p>
            </div>
          ) : null}
        </div>

        <div className="w-full min-w-0 border-t border-ink-100 pt-4 min-[720px]:border-0 min-[720px]:pt-0 lg:w-auto lg:max-w-md lg:flex-none">
          <h4 className="text-base font-bold text-ink-900">Covered players</h4>
          <p className="mt-0.5 text-sm text-ink-500">
            Players this subscription covers (by Badminton England number).
          </p>
          <div className="mt-3 overflow-x-auto overflow-y-hidden rounded-lg border border-ink-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-[#f3f1f8] text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">BE Number</th>
                </tr>
              </thead>
              <tbody>
                {coveredPlayers.map((player) => (
                  <tr key={player.beNumber} className="border-b border-ink-50 last:border-0">
                    <td className="px-3 py-2">
                      <a
                        href={`https://www.badminfo.com/player?name=${encodeURIComponent(player.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-normal text-badminfo-link underline underline-offset-2 hover:opacity-80"
                      >
                        {player.name}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-ink-700">{player.beNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="lg:max-w-4xl">
        <PremiumTermsFooter />
      </div>
    </div>
  )
}

function PlanChoice({
  plan,
  selected,
  onSelect,
  title,
  price,
  hint,
}: {
  plan: PremiumPlan
  selected: PremiumPlan
  onSelect: (plan: PremiumPlan) => void
  title: string
  price: string
  hint?: string
}) {
  const active = selected === plan
  return (
    <label
      className={`flex h-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3.5 py-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-badminfo-link/40 ${
        active
          ? 'border-badminfo-link bg-[#faf4ff]'
          : 'border-[#e3e3e6] bg-white hover:border-[#cdced6]'
      }`}
    >
      <input
        type="radio"
        name="premium-settings-plan"
        checked={active}
        onChange={() => onSelect(plan)}
        className="sr-only"
      />
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            active ? 'border-badminfo-link' : 'border-[#c8c8cc]'
          }`}
          aria-hidden
        >
          {active ? <span className="h-2 w-2 rounded-full bg-badminfo-link" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink-900">{title}</span>
          {hint ? (
            <span className="mt-0.5 block text-xs font-semibold text-[#198754]">{hint}</span>
          ) : null}
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-ink-900">{price}</span>
    </label>
  )
}

function UnsubscribedPremiumTab({
  onSignUpPremium,
}: {
  onSignUpPremium: (plan: PremiumPlan) => void
}) {
  const [plan, setPlan] = useState<PremiumPlan>('yearly')

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 md:items-start md:gap-x-10 lg:grid-cols-12 lg:gap-x-12 xl:gap-x-14 2xl:gap-x-16">
        <div className="lg:col-span-5 xl:col-span-6">
          <h3 className="text-lg font-bold text-ink-900">Premium</h3>
          <p className="mt-1 text-sm text-ink-500">{PREMIUM_PITCH_TAGLINE}</p>

          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-ink-900">Status</span>
            <StatusPill label="Inactive" tone="idle" />
          </div>

          <fieldset className="mt-3">
            <legend className="sr-only">Choose a plan</legend>
            <div className="grid grid-cols-1 gap-2.5">
              <PlanChoice
                plan="yearly"
                selected={plan}
                onSelect={setPlan}
                title="Yearly"
                hint={`Save ${formatPriceGbp(PREMIUM_YEARLY_SAVINGS_GBP)}/yr`}
                price={`${formatPriceGbp(PREMIUM_YEARLY_PRICE_GBP)}/yr`}
              />
              <PlanChoice
                plan="monthly"
                selected={plan}
                onSelect={setPlan}
                title="Monthly"
                price={`${formatPriceGbp(PREMIUM_MONTHLY_PRICE_GBP)}/mo`}
              />
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => onSignUpPremium(plan)}
            className="mt-4 flex w-full items-center justify-center rounded-md bg-badminfo-link px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4a287d] focus:outline-none focus-visible:ring-2 focus-visible:ring-badminfo-link focus-visible:ring-offset-2"
          >
            Subscribe to Premium
          </button>
        </div>

        <div className="mt-6 border-t border-[#ececf1] pt-5 md:mt-0 md:border-0 md:pt-0 lg:col-span-7 xl:col-span-6">
          <h4 className="text-base font-bold text-ink-900">What you get</h4>
          <ul className="mt-4 space-y-4">
            {PREMIUM_PITCH_BENEFITS.map((benefit) => (
              <li key={benefit.title} className="flex gap-2">
                <span className="mt-0.5 w-4 shrink-0 text-sm font-bold text-badminfo-link" aria-hidden>
                  ✓
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink-900">{benefit.title}</p>
                  <p className="mt-0.5 text-sm leading-snug text-ink-600">{benefit.value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <PremiumTermsFooter />
    </div>
  )
}
