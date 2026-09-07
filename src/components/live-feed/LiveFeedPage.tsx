import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import { RecapReadyCard, type RecapReadyCardData } from './RecapReadyCard'

type Props = {
  open: boolean
  onClose: () => void
}

const SAMPLE_RECAP_READY: RecapReadyCardData = {
  competitionName: 'Leicestershire Masters Silver 2026',
  dateLabel: '05 & 06 Sept 2026',
  categoryLabel: 'Silver',
}

export function LiveFeedPage({ open, onClose }: Props) {
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

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-white outline-none"
    >
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}badminfo-icon.png`}
              alt=""
              className="h-9 w-9 object-contain"
            />
            <span id={titleId} className="text-lg font-bold italic text-brand-600 sm:text-xl">
              BADMINFO
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close live feed"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        <RecapReadyCard card={SAMPLE_RECAP_READY} />
      </div>
    </div>,
    document.body,
  )
}
