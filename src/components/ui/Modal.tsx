import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Optional footer actions (Save, Cancel, etc.) */
  footer?: ReactNode
}

const BACKDROP_CLASS = 'fixed inset-0 z-40 bg-ink-900/40'
const PANEL_CLASS =
  'card-frame fixed left-1/2 top-1/2 z-50 flex max-h-[min(90vh,640px)] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-2 ring-brand-200 outline-none'

export function Modal({ open, onClose, title, children, footer }: Props) {
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

  return createPortal(
    <>
      <div className={BACKDROP_CLASS} aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={PANEL_CLASS}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onClose()
          }
        }}
      >
        <div className="border-b border-ink-100 px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-base font-semibold text-ink-900">
            {title}
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer != null && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 px-4 py-3 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body,
  )
}
