import { BetaBadge } from '../ui/BetaBadge'
import { Modal, ModalTitle } from '../ui/Modal'
import {
  formatPriceGbp,
  PREMIUM_MONTHLY_PRICE_GBP,
  PREMIUM_YEARLY_PRICE_GBP,
} from '../../lib/premiumPricing'
import { PremiumCrown } from './PremiumCrown'

type Props = {
  open: boolean
  onClose: () => void
  onSubscribe: () => void
}

const PLAYER_LAB_INCLUDES = [
  'Tournament recaps of the weekend',
  'Notes that come back the next time you play them',
  'The people behind your results',
  'Stats on your own play',
] as const

const SECONDARY_BUTTON_CLASS =
  'rounded-sm border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-900 transition hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

const PRIMARY_BUTTON_CLASS =
  'rounded-sm bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

/**
 * Shown when someone without Premium opens Player Lab from the top nav.
 * Explains the feature is part of a Premium subscription and offers signup.
 */
export function PlayerLabGateModal({ open, onClose, onSubscribe }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Player Lab needs Premium"
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
      <div className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-br from-brand-50 via-white to-[#fbf6e8] px-5 pb-4 pt-3 text-center text-ink-900">
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
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fbf6e8] text-favourite-star shadow-sm ring-4 ring-[#f3ead0]">
            <PremiumCrown className="h-5 w-5" />
          </span>
          <ModalTitle className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            Player Lab needs Premium
          </ModalTitle>
          <p className="mt-0.5 max-w-xs text-sm text-ink-600">
            This feature requires a Premium subscription.
          </p>
          <BetaBadge className="mt-2" />
        </div>
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        <p className="text-sm text-ink-700">
          Tournament recaps, notes, the people behind your results, and stats on your own play -
          all in one place.
        </p>
        <ul className="space-y-2" aria-label="What Player Lab includes">
          {PLAYER_LAB_INCLUDES.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-ink-800">
              <span className="font-bold text-brand-600" aria-hidden>
                ✓
              </span>
              {item}
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
