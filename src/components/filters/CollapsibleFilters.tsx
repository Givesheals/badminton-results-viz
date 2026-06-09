import { useId, useMemo, useState, type ReactNode } from 'react'

// Shared wrapper for section-level filters. New filter groups should use this component
// so cards stay compact by default and interaction remains consistent across the app.
type Props = {
  children: ReactNode
  label?: string
  defaultOpen?: boolean
  storageKey?: string
  activeCount?: number
  onReset?: () => void
  className?: string
  contentClassName?: string
}

export function CollapsibleFilters({
  children,
  label = 'Filters',
  defaultOpen = false,
  storageKey,
  activeCount = 0,
  onReset,
  className = 'w-full',
  contentClassName = 'flex flex-wrap items-end gap-3',
}: Props) {
  const showReset = onReset != null && activeCount > 0
  const [open, setOpen] = useState<boolean>(() => {
    if (!storageKey || typeof window === 'undefined') return defaultOpen
    const saved = window.sessionStorage.getItem(storageKey)
    if (saved === 'open') return true
    if (saved === 'closed') return false
    return defaultOpen
  })
  const panelId = useId()

  const buttonLabel = useMemo(() => {
    if (activeCount > 0) {
      return `${label} (${activeCount})`
    }
    return label
  }, [activeCount, label])

  function toggle() {
    setOpen((value) => {
      const next = !value
      if (storageKey && typeof window !== 'undefined') {
        window.sessionStorage.setItem(storageKey, next ? 'open' : 'closed')
      }
      return next
    })
  }

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-50/60 shadow-sm ${className}`.trim()}
    >
      <div className="flex w-full items-center pr-2">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink-800 transition hover:bg-ink-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
        >
          <FilterIcon className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="truncate">{buttonLabel}</span>
          <Chevron open={open} className="ml-auto" />
        </button>
        {showReset ? (
          <button
            type="button"
            onClick={onReset}
            className="mr-1 shrink-0 px-1 text-xs font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
          >
            Reset
          </button>
        ) : null}
      </div>
      {open ? (
        <div
          id={panelId}
          className={`border-t border-ink-200 bg-white px-3 py-3 ${contentClassName}`.trim()}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M2 3.75A.75.75 0 012.75 3h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm2.5 5.25a.75.75 0 010-1.5h9.5a.75.75 0 010 1.5H4.5zm2.5 5.25a.75.75 0 010-1.5h4.5a.75.75 0 010 1.5H7z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-ink-500 transition ${open ? 'rotate-180' : ''} ${className ?? ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}
