import { getTournamentCategoryChipStyle } from '../../lib/tournamentCategoryStyle'

type Props = {
  label: string
  className?: string
}

export function TournamentCategoryChip({ label, className = '' }: Props) {
  const style = getTournamentCategoryChipStyle(label)
  if (style == null) return null

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs leading-none ${style.chipClass} ${className}`}
    >
      {style.label}
    </span>
  )
}
