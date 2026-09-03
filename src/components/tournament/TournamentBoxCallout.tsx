type Variant = 'you' | 'favourite'

type Props = {
  variant: Variant
  /** Used for the favourite callout, e.g. "Daniel Bates". */
  playerName?: string
  className?: string
}

function favouriteBoxLabel(playerName: string): string {
  return `${playerName}'s box`
}

export function TournamentBoxCallout({ variant, playerName, className = '' }: Props) {
  const isYou = variant === 'you'
  const label = isYou ? 'Your box' : favouriteBoxLabel(playerName?.trim() || 'Favourite')

  return (
    <span
      className={`inline-flex w-fit items-center whitespace-nowrap px-2.5 py-1.5 text-xs font-bold leading-none text-white ${
        isYou ? 'bg-box-callout-you shadow-sm' : 'bg-box-callout-favourite'
      } ${className}`}
    >
      {label}
    </span>
  )
}
