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
  onSignUpPremium: () => void
  onManageSubscription: () => void
}

type SettingsTab = 'general' | 'favourites' | 'notifications' | 'premium'
type DemoView = 'subscribed' | 'unsubscribed'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'favourites', label: 'Favourites' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'premium', label: 'Premium' },
]

/** Value-led pitch lines: what you get, not just what the feature is. */
const PREMIUM_PITCH_BENEFITS: { title: string; value: string }[] = [
  {
    title: 'Personal notes',
    value: 'Capture what worked last time so you hold a tactical edge on rematches.',
  },
  {
    title: 'Analytics',
    value: 'See how you, your partners, and your results really trend over time.',
  },
  {
    title: 'Draw Companion',
    value: 'Spot likely opponents early and prepare before you step on court.',
  },
  {
    title: 'Tournament recaps',
    value: 'Relive the weekend — the results, the run, the story worth keeping.',
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

function buildDemoPremium(playerName: string): StoredPremiumState {
  return {
    playerName,
    beNumber: '1206628',
    receiptEmail: 'demo@badminfo.example',
    plan: 'yearly',
    subscribedAt: '2025-03-03T12:00:00.000Z',
  }
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
      <dt className="text-sm font-semibold text-ink-900">{label}</dt>
      <dd className="text-sm font-medium text-brand-700">{children}</dd>
    </div>
  )
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active
          ? 'bg-court-50 text-court-700 ring-1 ring-court-200'
          : 'bg-ink-100 text-ink-600 ring-1 ring-ink-200'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-court-600' : 'bg-ink-400'}`}
        aria-hidden
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
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
    setDemoView(isSubscribed ? 'subscribed' : 'unsubscribed')
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

  const showSubscribed = demoView === 'subscribed'
  const displayPremium = premium ?? (showSubscribed ? buildDemoPremium(playerName) : null)
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-500">Demo view:</span>
          <div
            role="group"
            aria-label="Premium subscription demo state"
            className="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-0.5"
          >
            {(
              [
                { id: 'subscribed', label: 'Subscribed' },
                { id: 'unsubscribed', label: 'Not subscribed' },
              ] as const
            ).map((option) => {
              const selected = demoView === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDemoView(option.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-ink-500 hover:text-ink-700'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-ink-200 bg-white shadow-sm">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">User Settings</h2>

            <nav
              className="mt-4 flex gap-1 overflow-x-auto border-b border-ink-200"
              aria-label="Settings sections"
            >
              {TABS.map((tab) => {
                const selected = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
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

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            {activeTab === 'premium' ? (
              showSubscribed && displayPremium ? (
                <SubscribedPremiumTab
                  premium={displayPremium}
                  coveredPlayers={coveredPlayers}
                  onManageSubscription={onManageSubscription}
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
  coveredPlayers,
  onManageSubscription,
}: {
  premium: StoredPremiumState
  coveredPlayers: { name: string; beNumber: string }[]
  onManageSubscription: () => void
}) {
  const nextRenews = nextRenewalIso(premium.subscribedAt, premium.plan)

  return (
    <div className="space-y-1">
      <h3 className="text-base font-bold text-ink-900">Premium</h3>
      <p className="text-sm text-ink-500">Your Badminfo Premium account</p>

      <dl className="mt-4 divide-y divide-ink-100 border-t border-ink-100">
        <DetailRow label="Status">
          <StatusPill active />
        </DetailRow>
        <DetailRow label="Plan">
          {planLabel(premium.plan)}
          <span className="ml-1.5 font-normal text-ink-500">
            · {planBillingDescription(premium.plan)}
          </span>
        </DetailRow>
        <DetailRow label="Next renews">{formatDisplayDate(nextRenews)}</DetailRow>
        <DetailRow label="Subscribed since">{formatDisplayDate(premium.subscribedAt)}</DetailRow>
      </dl>

      <div className="mt-6 border-t border-ink-100 pt-5">
        <h4 className="text-sm font-bold text-ink-900">Covered players</h4>
        <p className="mt-1 text-xs text-ink-500">
          Players this subscription covers (by Badminton England number).
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-ink-100">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-[#f6f2fa] text-xs font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-3 py-2.5 font-semibold">Name</th>
                <th className="px-3 py-2.5 font-semibold">BE Number</th>
              </tr>
            </thead>
            <tbody>
              {coveredPlayers.map((player) => (
                <tr key={player.beNumber} className="border-b border-ink-50 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-brand-700">{player.name}</td>
                  <td className="px-3 py-2.5 text-ink-700">{player.beNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 border-t border-ink-100 pt-5">
        <button
          type="button"
          onClick={onManageSubscription}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Manage subscription
          <ExternalLinkIcon />
        </button>
        <p className="mt-2 text-xs text-ink-500">
          Opens the Stripe Customer Portal (cancel, change plan, payment details).
        </p>
      </div>
    </div>
  )
}

function UnsubscribedPremiumTab({ onSignUpPremium }: { onSignUpPremium: () => void }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-bold text-ink-900">Premium</h3>
        <BetaBadge />
      </div>
      <p className="text-sm text-ink-500">Get more from Badminfo</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 py-3">
        <span className="text-sm font-semibold text-ink-900">Status</span>
        <StatusPill active={false} />
      </div>

      {/* CTA above the fold — primary action before benefits or scrolling */}
      <div className="border-t border-ink-100 pt-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-brand-500 bg-brand-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Yearly</p>
            <p className="mt-1 text-lg font-bold text-ink-900">
              {formatPriceGbp(PREMIUM_YEARLY_PRICE_GBP)}
              <span className="text-sm font-medium text-ink-500">/yr</span>
            </p>
            <p className="mt-0.5 text-xs font-medium text-court-700">
              Save {formatPriceGbp(PREMIUM_YEARLY_SAVINGS_GBP)}
            </p>
          </div>
          <div className="rounded-xl border border-ink-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Monthly</p>
            <p className="mt-1 text-lg font-bold text-ink-900">
              {formatPriceGbp(PREMIUM_MONTHLY_PRICE_GBP)}
              <span className="text-sm font-medium text-ink-500">/mo</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignUpPremium}
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
