import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, useState } from 'react'
import {
  captureNotesPreview,
  drawOutPreview,
  type NotificationPreviewKind,
} from '../../lib/notificationPreviewData'
import { CaptureNotesEmail } from './CaptureNotesEmail'
import { DrawOutEmail } from './DrawOutEmail'

type Props = {
  open: boolean
  onClose: () => void
}

type Tab = {
  kind: NotificationPreviewKind
  label: string
  subject: string
  /** One-line note on when this fires, shown as context above the email. */
  trigger: string
  payload: unknown
}

const TABS: Tab[] = [
  {
    kind: 'captureNotes',
    label: 'Capture your notes',
    subject: 'How did you get on? Capture your notes',
    trigger:
      'Sends once per competition when results suggest you are done - knocked out or victorious.',
    payload: captureNotesPreview,
  },
  {
    kind: 'drawOut',
    label: 'Your draw is out',
    subject: `${drawOutPreview.competitionName} draw out!`,
    trigger: 'Sends when a tournament you entered publishes its draw.',
    payload: drawOutPreview,
  },
]

function PayloadDisclosure({ payload }: { payload: unknown }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mx-auto mt-4 w-full max-w-[600px]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="text-xs font-medium text-ink-500 hover:text-ink-700"
      >
        {open ? '▾' : '▸'} View SendGrid data payload
      </button>
      {open && (
        <pre className="mt-2 max-h-80 overflow-auto rounded-lg border border-ink-200 bg-ink-900 p-4 text-xs leading-relaxed text-ink-50">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </div>
  )
}

export function NotificationsPreview({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const [activeKind, setActiveKind] = useState<NotificationPreviewKind>('captureNotes')

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

  const activeTab = TABS.find((tab) => tab.kind === activeKind) ?? TABS[0]

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-ink-50 outline-none"
    >
      <header className="flex items-center justify-between border-b border-ink-200 bg-white px-5 py-4">
        <div>
          <h1 id={titleId} className="text-base font-semibold text-ink-900">
            Notifications
          </h1>
          <p className="text-xs text-ink-500">Email previews - not sent, dummy data</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-700"
          aria-label="Close notifications preview"
        >
          ✕
        </button>
      </header>

      <div className="border-b border-ink-200 bg-white px-5">
        <div
          role="tablist"
          aria-label="Notification types"
          className="mx-auto flex max-w-[600px] gap-1"
        >
          {TABS.map((tab) => {
            const selected = tab.kind === activeKind
            return (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveKind(tab.kind)}
                className={`-mb-px border-b-2 px-3 py-3 text-sm font-medium transition ${
                  selected
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-ink-500 hover:text-ink-700'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto mb-4 w-full max-w-[600px] space-y-1">
          <p className="text-sm font-medium text-ink-700">
            Subject: <span className="font-normal text-ink-600">{activeTab.subject}</span>
          </p>
          <p className="text-xs text-ink-500">{activeTab.trigger}</p>
        </div>

        {activeKind === 'captureNotes' ? (
          <CaptureNotesEmail data={captureNotesPreview} />
        ) : (
          <DrawOutEmail data={drawOutPreview} />
        )}

        <PayloadDisclosure payload={activeTab.payload} />
      </div>
    </div>,
    document.body,
  )
}
