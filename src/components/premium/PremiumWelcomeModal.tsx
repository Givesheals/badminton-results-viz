import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import {
  formatPriceGbp,
  planBillingDescription,
  planLabel,
  planPriceGbp,
  type PremiumPlan,
} from '../../lib/premiumPricing'

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
}

const CONFETTI_COLORS = [
  'bg-shuttle-400',
  'bg-brand-300',
  'bg-court-300',
  'bg-violet-300',
  'bg-teal-300',
  'bg-amber-300',
] as const

const CONFETTI_SLOTS = [
  { top: '14%', left: '6%' },
  { top: '30%', left: '16%' },
  { top: '10%', left: '32%' },
  { top: '16%', left: '72%' },
  { top: '8%', left: '88%' },
  { top: '40%', left: '93%' },
  { top: '78%', left: '8%' },
  { top: '82%', left: '86%' },
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

function ArrowRightIcon({ className }: { className?: string }) {
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

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2.5 14.5h15l-1.2-7.2a.75.75 0 00-1.22-.42L12 9.5 10.42 5.3a.75.75 0 00-1.34 0L7.5 9.5 4.42 6.88a.75.75 0 00-1.22.42L2.5 14.5zM3 16a1 1 0 001 1h12a1 1 0 001-1v-.5H3V16z" />
    </svg>
  )
}

/** Display (inline-flex / hidden) is set per chip so narrow screens can drop the first chips. */
const MOCK_CHIP = 'shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium'

/**
 * Small drawing of the Stage row on a tournament page, with the Companion chip
 * highlighted. Built from the same chip styles as the real page so it stays accurate.
 */
function StageRowGuide() {
  return (
    <div
      className="mt-3 rounded-xl border border-ink-200 bg-white px-3 pb-2.5 pt-3"
      aria-hidden
    >
      <div className="space-y-1.5">
        <div className="h-2 w-2/3 rounded-full bg-ink-100" />
        <div className="h-2 w-2/5 rounded-full bg-ink-100" />
      </div>
      <div className="mt-3 flex items-start gap-1.5 pb-7">
        <span className="shrink-0 py-1 text-xs font-medium text-brand-700">Stage:</span>
        <span className={`${MOCK_CHIP} hidden bg-ink-100 text-brand-700 min-[480px]:inline-flex`}>
          Entries
        </span>
        <span className={`${MOCK_CHIP} hidden bg-ink-100 text-brand-700 min-[400px]:inline-flex`}>
          Groups
        </span>
        <span
          className={`${MOCK_CHIP} inline-flex border border-ink-900 bg-ink-200 text-ink-900`}
        >
          Finals
        </span>
        <span className="relative inline-flex shrink-0">
          <span className="absolute -inset-1 rounded-full ring-2 ring-brand-500 motion-safe:animate-pulse" />
          <span className={`${MOCK_CHIP} relative inline-flex bg-ink-100 text-brand-700`}>
            Companion
            <CrownIcon className="h-3 w-3 shrink-0 text-amber-500" />
          </span>
          <span className="absolute left-1/2 top-full mt-2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-700">
            <ArrowUpIcon className="h-3 w-3" />
            Tap Companion
          </span>
        </span>
      </div>
    </div>
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

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80] bg-ink-900/50" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card-frame fixed left-1/2 top-1/2 z-[90] flex max-h-[min(94vh,760px)] w-[min(100vw-1.5rem,30rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-2 ring-brand-200 outline-none"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="relative overflow-hidden border-b border-brand-100 bg-gradient-to-br from-brand-50 via-white to-court-50 px-5 pb-3.5 pt-3.5 text-center text-ink-900">
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
              className="absolute right-2.5 top-2.5 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
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
              <span className="animate-premium-welcome-check-pop flex h-9 w-9 items-center justify-center rounded-full bg-court-600 text-white shadow-sm ring-4 ring-court-100">
                <TickIcon className="h-5 w-5" />
              </span>
              <h2 id={titleId} className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                {name ? `You're in, ${name}.` : "You're in."}
              </h2>
              <p className="mt-0.5 text-sm text-ink-600">
                Premium is now active for{' '}
                <span className="font-semibold text-ink-900">{playerName}</span>
                {beNumber ? ` (BE ${beNumber})` : ''}.
              </p>
            </div>
          </div>

          <div className="space-y-4 px-4 pb-5 pt-4 sm:px-5">
            {/* Player Lab - first thing under the hero so it is always on screen */}
            <button
              type="button"
              onClick={onOpenPlayerLab}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-4 text-base font-bold text-white shadow-md transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
            >
              Open your Player Lab
              <ArrowRightIcon className="h-4 w-4" />
            </button>

            {/* Draw Companion - short pointer to where it lives */}
            <section
              aria-label="Draw Companion"
              className="rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3"
            >
              <h3 className="text-sm font-bold text-ink-900">
                You&apos;ve also unlocked Draw Companion
              </h3>
              <p className="mt-0.5 text-sm text-ink-600">
                Once a tournament&apos;s draw has been made, you&apos;ll find it in the Stage row on
                that tournament&apos;s page.
              </p>
              <StageRowGuide />
            </section>

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
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div>
                  <dt className="text-xs text-ink-500">Plan</dt>
                  <dd className="font-medium text-ink-900">
                    {planLabel(plan)} · {planBillingDescription(plan)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">Paid today</dt>
                  <dd className="font-medium text-ink-900">
                    {formatPriceGbp(planPriceGbp(plan))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">Next renewal</dt>
                  <dd className="font-medium text-ink-900">
                    {formatDate(firstRenewalIso(subscribedAt, plan))}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-ink-500">Receipt sent to</dt>
                  <dd className="break-words font-medium text-ink-900">
                    {receiptEmail || 'your email'}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
