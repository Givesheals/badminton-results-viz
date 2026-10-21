import { BetaBadge } from '../ui/BetaBadge'
import { Modal, ModalTitle } from '../ui/Modal'
import {
  formatPriceGbp,
  PREMIUM_MONTHLY_PRICE_GBP,
  PREMIUM_YEARLY_PRICE_GBP,
} from '../../lib/premiumPricing'
import { PREMIUM_PITCH_TAGLINE } from './premiumPitch'

type Props = {
  open: boolean
  onClose: () => void
  onSubscribe: () => void
}

/** Short lines taken from the Premium pitch. Full wording stays on the settings page. */
const ANNOUNCEMENT_BENEFITS = [
  'Personal notes for your next draw',
  'Analytics on your results',
  'Draw Companion to the final',
  'Tournament recaps of the weekend',
] as const

const CONFETTI_COLORS = [
  'bg-shuttle-400',
  'bg-brand-300',
  'bg-court-300',
  'bg-violet-300',
  'bg-teal-300',
  'bg-amber-300',
] as const

const CONFETTI_SLOTS = [
  { top: '18%', left: '8%' },
  { top: '36%', left: '18%' },
  { top: '14%', left: '34%' },
  { top: '22%', left: '70%' },
  { top: '12%', left: '84%' },
  { top: '48%', left: '90%' },
  { top: '72%', left: '10%' },
  { top: '78%', left: '82%' },
] as const

const SECONDARY_BUTTON_CLASS =
  'rounded-sm border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-900 transition hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

const PRIMARY_BUTTON_CLASS =
  'rounded-sm bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.4l1.55 5.55L19.2 9.5l-5.65 1.55L12 16.6l-1.55-5.55L4.8 9.5l5.65-1.55L12 2.4z" />
      <path d="M18.2 14.2l.65 2.15 2.15.65-2.15.65-.65 2.15-.65-2.15-2.15-.65 2.15-.65.65-2.15z" />
    </svg>
  )
}

/**
 * Celebration announcement inside the BadmInfo information modal:
 * square frame, the X in the header corner, and the standard footer buttons.
 */
export function PremiumAnnouncementModal({ open, onClose, onSubscribe }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Premium is here"
      frame="plain"
      hideTitleBar
      padded={false}
      footer={
        <>
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON_CLASS}>
            Not now
          </button>
          <button type="button" onClick={onSubscribe} className={PRIMARY_BUTTON_CLASS}>
            Subscribe to Premium
          </button>
        </>
      }
    >
      <div className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-br from-brand-50 via-white to-court-50 px-5 pb-4 pt-3 text-center text-ink-900">
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
          className="absolute right-4 top-3 z-[1] rounded-lg p-1 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 sm:right-5"
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
          <span className="animate-premium-welcome-check-pop flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm ring-4 ring-brand-100">
            <SparkIcon className="h-5 w-5" />
          </span>
          <ModalTitle className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            Premium is here.
          </ModalTitle>
          <p className="mt-0.5 text-sm text-ink-600">{PREMIUM_PITCH_TAGLINE}</p>
          <BetaBadge className="mt-2" />
        </div>
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        <ul className="space-y-2" aria-label="What you get">
          {ANNOUNCEMENT_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-2 text-sm text-ink-800">
              <span className="font-bold text-brand-600" aria-hidden>
                ✓
              </span>
              {benefit}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-500">
          {formatPriceGbp(PREMIUM_MONTHLY_PRICE_GBP)}/month or{' '}
          {formatPriceGbp(PREMIUM_YEARLY_PRICE_GBP)}/year. Cancel anytime.
        </p>
      </div>
    </Modal>
  )
}
