type Props = {
  label: string | null | undefined
  className?: string
}

/** Identity pill for Junior / Senior / Masters or a more specific band (U19, O40). */
export function CompetitionAgeChip({ label, className = '' }: Props) {
  if (!label) return null

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold leading-none text-ink-800 ${className}`}
    >
      {label}
    </span>
  )
}
