import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import {
  formatPriceGbp,
  planBillingDescription,
  planLabel,
  planPriceGbp,
  type PremiumPlan,
} from '../../lib/premiumPricing'
import { BetaBadge } from '../ui/BetaBadge'

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
  beNumber: string
  plan: PremiumPlan
  /** ISO date the subscription started (payment taken). */
  subscribedAt: string
  receiptEmail: string
  /** Close everything and show the Player Lab (the main dashboard). */
  onOpenPlayerLab: () => void
  onManageSubscription?: () => void
}

const ALSO_INCLUDED = [
  'Opponent notes',
  'Match journal',
  'Partner chemistry',
  'Category milestones',
  'Tournament recaps',
]

const CONFETTI_COLORS = [
  'bg-shuttle-400',
  'bg-brand-300',
  'bg-court-300',
  'bg-violet-300',
  'bg-teal-300',
  'bg-amber-300',
] as const

const CONFETTI_SLOTS = [
  { top: '12%', left: '6%' },
  { top: '22%', left: '16%' },
  { top: '10%', left: '30%' },
  { top: '16%', left: '70%' },
  { top: '8%', left: '86%' },
  { top: '30%', left: '93%' },
  { top: '62%', left: '5%' },
  { top: '74%', left: '18%' },
  { top: '70%', left: '82%' },
  { top: '56%', left: '95%' },
] as const

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function firstRenewalIso(subscribedAt: string, plan: PremiumPlan): string {
  const next = new Date(subscribedAt)
  if (Number.isNaN(next.getTime())) return subscribedAt
  if (plan === 'monthly') next.setMonth(next.getMonth() + 1)
  else next.setFullYear(next.getFullYear() + 1)
  return next.toISOString()
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? ''
}

function TickIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function PremiumWelcomeModal({
  open,
  onClose,
  playerName,
  beNumber,
  plan,
  subscribedAt,
  receiptEmail,
  onOpenPlayerLab,
  onManageSubscription,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

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

  const name = firstName(playerName)
  const previewSrc = `${import.meta.env.BASE_URL}premium-showcase/summary-desktop.jpg`

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80] bg-ink-900/50" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card-frame fixed left-1/2 top-1/2 z-[90] flex max-h-[min(94vh,860px)] w-[min(100vw-1.5rem,36rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-2 ring-brand-200 outline-none"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-5 pb-7 pt-8 text-center text-white sm:px-8">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {CONFETTI_SLOTS.map((slot, i) => (
                <span
                  key={i}
                  className={`animate-premium-welcome-confetti-float absolute rotate-45 rounded-sm opacity-80 ${
                    CONFETTI_COLORS[i % CONFETTI_COLORS.length]
                  } ${i % 3 === 0 ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5'}`}
                  style={{ top: slot.top, left: slot.left, animationDelay: `${(i % 5) * 0.4}s` }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Close"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <div className="relative z-[1] flex flex-col items-center">
              <span className="animate-premium-welcome-check-pop flex h-16 w-16 items-center justify-center rounded-full bg-shuttle-400 text-brand-800 shadow-lg ring-4 ring-white/20">
                <TickIcon className="h-8 w-8" />
              </span>
              <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-100">
                Premium is active
                <BetaBadge />
              </p>
              <h2
                id={titleId}
                className="mt-1 text-3xl font-black tracking-tight sm:text-4xl"
              >
                {name ? `You're in, ${name}.` : "You're in."}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-brand-100">
                Premium is now active for{' '}
                <span className="font-semibold text-white">{playerName}</span>
                {beNumber ? ` (BE ${beNumber})` : ''}. Everything is unlocked and ready to use.
              </p>
            </div>
          </div>

          <div className="space-y-5 px-4 py-5 sm:px-6">
            {/* Payment confirmation */}
            <section
              aria-label="Payment confirmation"
              className="rounded-xl border border-court-200 bg-court-50 px-4 py-3"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-court-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-court-600 text-white">
                  <TickIcon className="h-3 w-3" />
                </span>
                Payment taken - thank you
              </p>
              <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex items-baseline justify-between gap-2 sm:block">
                  <dt className="text-xs text-ink-500">Plan</dt>
                  <dd className="font-medium text-ink-900">
                    {planLabel(plan)} · {planBillingDescription(plan)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 sm:block">
                  <dt className="text-xs text-ink-500">Paid today</dt>
                  <dd className="font-medium text-ink-900">
                    {formatPriceGbp(planPriceGbp(plan))}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 sm:block">
                  <dt className="text-xs text-ink-500">Next renewal</dt>
                  <dd className="font-medium text-ink-900">
                    {formatDate(firstRenewalIso(subscribedAt, plan))}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 sm:block">
                  <dt className="text-xs text-ink-500">Receipt sent to</dt>
                  <dd className="break-all font-medium text-ink-900">
                    {receiptEmail || 'your email'}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Player Lab - primary */}
            <section aria-label="Player Lab">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Start here
              </p>
              <div className="mt-2 overflow-hidden rounded-xl border-2 border-brand-300 bg-white shadow-sm">
                <div className="relative h-32 overflow-hidden bg-brand-50 sm:h-40">
                  <img
                    src={previewSrc}
                    alt=""
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent"
                    aria-hidden
                  />
                </div>
                <div className="px-4 pb-4 pt-1">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                    Player Lab
                    <BetaBadge />
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink-900">
                    Your whole game, in one place
                  </h3>
                  <p className="mt-1 text-sm text-ink-600">
                    Results trends, opponent matchups, partner chemistry, milestones and your own
                    notes - all built from your match history.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenPlayerLab}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
                  >
                    Open your Player Lab
                    <ArrowIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* Draw Companion - secondary, explain only */}
            <section
              aria-label="Draw Companion"
              className="rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                At a tournament
              </p>
              <h3 className="mt-1 text-sm font-bold text-ink-900">Draw Companion</h3>
              <p className="mt-1 text-sm text-ink-600">
                See your most likely path to the final, the chance of meeting each opponent, your
                notes on them and every time you have played them before.
              </p>
              <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-ink-700 ring-1 ring-ink-100">
                <span className="font-semibold text-ink-900">Where to find it:</span> open any
                tournament you are entered in, then tap{' '}
                <span className="font-semibold text-brand-700">Draw Companion</span>.
              </p>
            </section>

            {/* Also included */}
            <section aria-label="Also included">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Also included
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {ALSO_INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Footer info */}
            <section className="border-t border-ink-100 pt-4 text-sm text-ink-600">
              <p>
                Premium is in beta, so you may spot rough edges. Your feedback shapes what we build
                next.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <a
                  href="https://discord.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-700 hover:text-brand-600 hover:underline"
                >
                  Join the private Discord
                </a>
                {onManageSubscription ? (
                  <button
                    type="button"
                    onClick={onManageSubscription}
                    className="font-semibold text-brand-700 hover:text-brand-600 hover:underline"
                  >
                    Manage subscription
                  </button>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
