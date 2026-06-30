type Props = {
  className?: string
}

export function BetaBadge({ className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 ${className}`}
    >
      Beta
    </span>
  )
}
