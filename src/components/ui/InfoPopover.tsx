import { useId, useRef, useState, type ReactNode } from 'react'
import { InfoButton, type InfoButtonSize } from './InfoButton'
import { Modal } from './Modal'

type Props = {
  title: string
  label: string
  children: ReactNode
  size?: InfoButtonSize
}

const CLOSE_BUTTON_CLASS =
  'rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

export function InfoPopover({ title, label, children, size = 'md' }: Props) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  function close() {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <>
      <InfoButton
        ref={triggerRef}
        size={size}
        expanded={open}
        controlsId={panelId}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
      />
      <Modal
        id={panelId}
        open={open}
        onClose={close}
        title={title}
        showHeaderClose
        footer={
          <button type="button" className={CLOSE_BUTTON_CLASS} onClick={close}>
            Close
          </button>
        }
      >
        <div className="text-sm leading-relaxed text-ink-700">{children}</div>
      </Modal>
    </>
  )
}
