type EntryStatus = 'closed' | 'closes-soon'

type Props = {
  status: EntryStatus
  className?: string
}

const STATUS_STYLES: Record<EntryStatus, { label: string; chipClass: string }> = {
  closed: {
    label: 'Entry Closed',
    chipClass: 'bg-entry-closed text-white',
  },
  'closes-soon': {
    label: 'Entry Closes Soon',
    chipClass: 'bg-entry-closes-soon text-white',
  },
}

export function EntryStatusBadge({ status, className = '' }: Props) {
  const style = STATUS_STYLES[status]

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-none ${style.chipClass} ${className}`}
    >
      {style.label}
    </span>
  )
}
