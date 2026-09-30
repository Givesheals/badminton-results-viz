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
 * Outlined pill: 1px coloured border, same-colour bold text, no fill or wash
 * (matches the player profile chips). The invisible `before` layer gives it a
 * larger tap area so it stays small on 350px screens without being fiddly.
 */
const RATING_CHANGE_CHIP_BASE_CLASS =
  'relative inline-flex h-5 items-center justify-center rounded-full border bg-transparent px-2 text-[11px] font-bold leading-none tabular-nums before:absolute before:-inset-2 before:content-[""] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

/** Positive is green; zero and negative are red, as on the player profile. */
function ratingChangeToneClass(points: number): string {
  return points > 0
    ? 'border-gain-700 text-gain-700'
    : 'border-loss-700 text-loss-700'
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
        className={`${RATING_CHANGE_CHIP_BASE_CLASS} ${ratingChangeToneClass(change.points)} active:opacity-70`}
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
                    change.points > 0 ? 'text-gain-700' : 'text-loss-700'
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
