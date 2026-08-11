import { createPortal } from 'react-dom'
import { useEffect, useId, useRef } from 'react'
import { FileUpload } from './FileUpload'

type Props = {
  open: boolean
  onClose: () => void
}

export function AddNewDataPage({ open, onClose }: Props) {
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
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-[#f3f0f8] outline-none"
    >
      <header className="border-b border-ink-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
          <div>
            <h1 id={titleId} className="text-base font-semibold text-ink-900">
              Add new data
            </h1>
            <p className="text-xs text-ink-500">
              Import a match history export to replace or refresh the dashboard data
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close add new data"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <FileUpload onLoaded={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
