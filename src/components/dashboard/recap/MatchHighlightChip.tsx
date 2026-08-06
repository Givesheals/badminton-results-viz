import { createPortal } from 'react-dom'
import type { DisciplineMatchHighlight } from '../../../lib/tournamentRecap'
import { useDismissiblePopover } from '../../../hooks/useDismissiblePopover'
import { usePopoverPosition } from '../../../hooks/usePopoverPosition'

type Props = {
  highlight: DisciplineMatchHighlight
}

const BACKDROP_CLASS = 'fixed inset-0 z-40 bg-ink-900/30'
const PANEL_CLASS =
  'card-frame fixed z-50 rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink-800 shadow-xl ring-2 ring-brand-200 outline-none'

/** Equal-size icon pills so highlight strip stays tidy on narrow screens. */
const CHIP_ICON_CLASS =
  'inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 px-1.5 text-sm leading-none text-ink-700'

const CHIP_TEXT_CLASS =
  'inline-flex h-7 shrink-0 items-center justify-center rounded-full bg-ink-100 px-2 text-[10px] font-medium leading-tight text-ink-700'

export function MatchHighlightChip({ highlight }: Props) {
  const { open, toggle, close, triggerRef, panelRef, panelId } = useDismissiblePopover()
  const position = usePopoverPosition(open, triggerRef)
  const isInteractive = highlight.popoverText != null
  const isIconChip = highlight.chipIcon != null
  const chipClass = isIconChip ? CHIP_ICON_CLASS : CHIP_TEXT_CLASS
  const chipContent = isIconChip ? (
    <span aria-hidden>{highlight.chipIcon}</span>
  ) : (
    highlight.label
  )

  if (!isInteractive) {
    return <span className={chipClass}>{chipContent}</span>
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${chipClass} transition hover:bg-ink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${highlight.label}: more info`}
        onClick={toggle}
      >
        {chipContent}
      </button>
      {open &&
        createPortal(
          <>
            <div className={BACKDROP_CLASS} aria-hidden onClick={close} />
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label={highlight.label}
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
              <p className="font-medium text-ink-900">{highlight.label}</p>
              <p className="mt-1.5 text-ink-700">{highlight.popoverText}</p>
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
