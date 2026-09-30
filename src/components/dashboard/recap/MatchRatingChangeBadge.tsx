import { createPortal } from 'react-dom'
import { useDismissiblePopover } from '../../../hooks/useDismissiblePopover'
import { usePopoverPosition } from '../../../hooks/usePopoverPosition'
import {
  formatRatingChangePoints,
  type MatchRatingChange,
} from '../../../lib/matchRatingChange'

type Props = {
  change: MatchRatingChange
}

const BACKDROP_CLASS = 'fixed inset-0 z-40 bg-ink-900/30'
const PANEL_CLASS =
  'card-frame fixed z-50 rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink-800 shadow-xl ring-2 ring-brand-200 outline-none'

/**
 * Slim outlined chip (17px tall, 12px semibold text): a softened 1px coloured
 * border, no fill or wash, softly rounded corners (7px; 8px would be a full
 * pill). The invisible `before` layer gives it a larger tap area so it stays
 * small on 350px screens without being fiddly.
 *
 * `top-px` drops the chip's box 1px so the digits, which sit low in their line
 * box, look centred inside it. The label is lifted 1px to cancel that out, so
 * the digits stay on the same baseline as the "Win" and score text beside them.
 */
const RATING_CHANGE_CHIP_CLASS =
  'relative top-px inline-flex h-[17px] shrink-0 items-center justify-center rounded-[7px] border bg-transparent px-1 text-xs font-semibold leading-none tabular-nums before:absolute before:-inset-2 before:content-[""] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 active:opacity-70'

/** Gains and no change are green; only losses are red, as on the player profile. */
function ratingChangeToneClass(points: number): string {
  return points >= 0
    ? 'border-gain-600/45 text-gain-600'
    : 'border-loss-600/45 text-loss-600'
}

/**
 * Grey filled pill with a hyphen, shown when a match cannot change a rating
 * (walkover or no match). Same height as the rating chips so rows stay aligned.
 */
export function MatchRatingIneligibleChip() {
  return (
    <span
      className="relative top-px inline-flex h-[17px] min-w-5 shrink-0 items-center justify-center rounded-[7px] bg-ink-100 px-1 text-xs font-semibold leading-none text-ink-600"
      role="img"
      aria-label="This match does not change your rating"
      title="This match does not change your rating"
    >
      {/* Text hyphens sit low in the line box, so lift it to the chip's centre. */}
      <span aria-hidden className="-translate-y-[1.5px]">
        -
      </span>
    </span>
  )
}

/** Per-match rating change pill. Tap to see how the change came about. */
export function MatchRatingChangeBadge({ change }: Props) {
  const { open, toggle, close, triggerRef, panelRef, panelId } = useDismissiblePopover()
  const position = usePopoverPosition(open, triggerRef)
  const label = formatRatingChangePoints(change.points)
  const title = 'Rating change'

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${RATING_CHANGE_CHIP_CLASS} ${ratingChangeToneClass(change.points)}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${title} ${label}: more info`}
        onClick={toggle}
      >
        {/*
          The chip box is dropped 1px (see `top-px` above), so lifting the label
          1px keeps the digits on the row's text baseline while they look centred
          in the chip. The +/- sign sits lower than the digits' centre, so it gets
          a further half pixel lift.
        */}
        <span className="inline-flex -translate-y-px items-center">
          <span className="-translate-y-[0.5px]">{label.charAt(0)}</span>
          {label.slice(1)}
        </span>
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
