import {
  prototypeDisciplineRatings,
  U19_RATING_DISCIPLINES,
  u19CircuitBandForRating,
  u19CircuitBandLabel,
  u19RatingDisciplineLabel,
  type U19CircuitBand,
} from '../../lib/opponentNoteIdentity'

const BAND_INSET_CLASS: Record<U19CircuitBand, string> = {
  bronze: 'shadow-[inset_0_0_0_1px_var(--color-level-bronze)]',
  silver: 'shadow-[inset_0_0_0_1px_var(--color-level-silver)]',
  gold: 'shadow-[inset_0_0_0_1px_var(--color-level-gold)]',
}

type ChipSize = 'default' | 'compact'

const CHIP_SIZE_CLASS: Record<ChipSize, string> = {
  default: 'min-w-[2.25rem] rounded-md px-1.5 py-0.5 text-xs font-semibold',
  compact: 'min-w-[1.625rem] rounded px-1 py-px text-[11px] font-semibold',
}

function RatingChip({
  value,
  discipline,
  size,
}: {
  value: number
  discipline: (typeof U19_RATING_DISCIPLINES)[number]
  size: ChipSize
}) {
  const band = u19CircuitBandForRating(value)
  const label = `${u19RatingDisciplineLabel(discipline)} rating ${value}, U19 ${u19CircuitBandLabel(band)}`

  return (
    <span
      className={`inline-flex items-center justify-center border border-ink-400 bg-white tabular-nums leading-none text-ink-900 ${CHIP_SIZE_CLASS[size]} ${BAND_INSET_CLASS[band]}`}
      title={label}
      aria-label={label}
    >
      {value}
    </span>
  )
}

export function OpponentRatingChips({
  opponentName,
  size = 'default',
}: {
  opponentName: string
  size?: ChipSize
}) {
  const ratings = prototypeDisciplineRatings(opponentName)

  return (
    <span
      className={`inline-flex items-center ${size === 'compact' ? 'gap-0.5' : 'gap-1'}`}
      aria-label="Current ratings"
    >
      {U19_RATING_DISCIPLINES.map((discipline, index) => (
        <RatingChip
          key={discipline}
          value={ratings[index]!}
          discipline={discipline}
          size={size}
        />
      ))}
    </span>
  )
}
