import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { usePopoverPosition } from '../../hooks/usePopoverPosition'
import { InfoButton, type InfoButtonSize } from './InfoButton'
import { useDismissiblePopover } from '../../hooks/useDismissiblePopover'

type Props = {
  label: string
  children: ReactNode
  size?: InfoButtonSize
}

const BACKDROP_CLASS = 'fixed inset-0 z-40 bg-ink-900/30'

const PANEL_CLASS =
  'card-frame fixed z-50 rounded-2xl bg-brand-50 p-4 text-sm leading-relaxed text-ink-800 shadow-xl ring-2 ring-brand-200 outline-none'

export function InfoPopover({ label, children, size = 'md' }: Props) {
  const { open, toggle, close, triggerRef, panelRef, panelId } = useDismissiblePopover()
  const position = usePopoverPosition(open, triggerRef)

  return (
    <>
      <InfoButton
        ref={triggerRef}
        size={size}
        expanded={open}
        controlsId={panelId}
        aria-label={label}
        onClick={toggle}
      />
      {open
        ? createPortal(
            <>
              <div className={BACKDROP_CLASS} aria-hidden />
              <div
                ref={panelRef}
                id={panelId}
                role="dialog"
                aria-label={label}
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
                {children}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  )
}
