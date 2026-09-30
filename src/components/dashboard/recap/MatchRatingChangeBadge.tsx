import { createPortal } from 'react-dom'
import { useDismissiblePopover } from '../../../hooks/useDismissiblePopover'
import { usePopoverPosition } from '../../../hooks/usePopoverPosition'
import {
  formatRatingChangePoints,
  type MatchRatingChange,
} from '../../../lib/matchRatingChange'

/**
 * `standard`: bold text, full-strength border (matches the player profile chip).
 * `light`: slimmer, semibold, brighter text and a softer border. Text stays 12px.
 */
export type RatingChipVariant = 'standard' | 'light'

type Props = {
  change: MatchRatingChange
  variant?: RatingChipVariant
}

const BACKDROP_CLASS = 'fixed inset-0 z-40 bg-ink-900/30'
const PANEL_CLASS =
  'card-frame fixed z-50 rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink-800 shadow-xl ring-2 ring-brand-200 outline-none'

/**
 * Outlined pill: 1px coloured border, same-colour bold text, no fill or wash
 * (matches the player profile chips). The invisible `before` layer gives it a
 * larger tap area so it stays small on 350px screens without being fiddly.
 */
const RATING_CHANGE_CHIP_BASE_CLASS =
  'relative inline-flex shrink-0 items-center justify-center rounded-full border bg-transparent text-xs leading-none tabular-nums before:absolute before:-inset-2 before:content-[""] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

const CHIP_SIZE_CLASS: Record<RatingChipVariant, string> = {
  standard: 'h-[18px] px-1.5 font-bold',
  light: 'h-4 px-1 font-semibold',
}

/** Gains and no change are green; only losses are red, as on the player profile. */
function ratingChangeToneClass(points: number, variant: RatingChipVariant): string {
  const positive = points >= 0
  if (variant === 'light') {
    return positive
      ? 'border-gain-600/45 text-gain-600'
      : 'border-loss-600/45 text-loss-600'
  }
  return positive
    ? 'border-gain-700 text-gain-700'
    : 'border-loss-700 text-loss-700'
}

/**
 * Grey filled pill with a hyphen, shown when a match cannot change a rating
 * (walkover or no match). Same height as the rating chips so rows stay aligned.
 */
export function MatchRatingIneligibleChip({
  variant = 'standard',
}: {
  variant?: RatingChipVariant
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs leading-none text-ink-600 ${
        variant === 'light' ? 'h-4 min-w-5 px-1 font-semibold' : 'h-[18px] min-w-6 px-1.5 font-bold'
      }`}
      role="img"
      aria-label="This match does not change your rating"
      title="This match does not change your rating"
    >
      -
    </span>
  )
}

/** Per-match rating change pill. Tap to see how the change came about. */
export function MatchRatingChangeBadge({ change, variant = 'standard' }: Props) {
  const { open, toggle, close, triggerRef, panelRef, panelId } = useDismissiblePopover()
  const position = usePopoverPosition(open, triggerRef)
  const label = formatRatingChangePoints(change.points)
  const title = 'Rating change'

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${RATING_CHANGE_CHIP_BASE_CLASS} ${CHIP_SIZE_CLASS[variant]} ${ratingChangeToneClass(change.points, variant)} active:opacity-70`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${title} ${label}: more info`}
        onClick={toggle}
      >
        {label}
      </button>
      {open &&
        createPortal(
          <>
            <div className={BACKDROP_CLASS} aria-hidden onClick={close} />
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label={title}
              tabIndex={-1}
              className={PANEL_CLASS}
              style={{
                top: position.top,
                left: position.left,
                right: position.right,
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation()
                  close()
                }
              }}
            >
              <p className="font-medium text-ink-900">
                {title}{' '}
                <span
                  className={`tabular-nums ${
                    change.points >= 0 ? 'text-gain-700' : 'text-loss-700'
                  }`}
                >
                  {label}
                </span>
              </p>
              <p className="mt-1.5 text-ink-700">{change.explanation}</p>
              <button
                type="button"
                className="mt-3 text-xs font-medium text-brand-700 underline decoration-brand-300 underline-offset-2"
                onClick={close}
              >
                Close
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
