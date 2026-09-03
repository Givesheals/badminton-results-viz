import {
  prototypeDisciplineRatings,
  U19_RATING_DISCIPLINES,
  u19CircuitBandForRating,
  u19CircuitBandLabel,
  u19RatingDisciplineLabel,
  type U19CircuitBand,
} from '../../lib/opponentNoteIdentity'

export type RatingChipBand = U19CircuitBand | 'copper' | 'unrated'

const INNER_COLOR: Record<RatingChipBand, string> = {
  unrated: 'var(--color-rating-chip-ring)',
  copper: 'var(--color-level-copper)',
  bronze: 'var(--color-level-bronze)',
  silver: 'var(--color-level-silver)',
  gold: 'var(--color-level-gold)',
}

type ChipSize = 'default' | 'compact'

const CHIP_SIZE_CLASS: Record<ChipSize, string> = {
  default: 'rounded px-1.5 py-1 text-xs font-semibold',
  compact: 'rounded px-1 py-0.5 text-[11px] font-semibold',
}

type RatingChipProps = {
  value?: number | null
  band?: RatingChipBand
  discipline?: (typeof U19_RATING_DISCIPLINES)[number]
  size?: ChipSize
}

function bandForValue(value: number | null | undefined, band?: RatingChipBand): RatingChipBand {
  if (band != null) return band
  if (value == null) return 'unrated'
  return u19CircuitBandForRating(value)
}

function chipLabel(value: number | null | undefined): string {
  return value == null ? '-' : String(value)
}

export function RatingChip({
  value = null,
  band,
  discipline,
  size = 'default',
}: RatingChipProps) {
  const resolvedBand = bandForValue(value, band)
  const display = chipLabel(value)
  const accessible =
    value == null || resolvedBand === 'unrated'
      ? 'No rating'
      : discipline != null &&
          (resolvedBand === 'bronze' || resolvedBand === 'silver' || resolvedBand === 'gold')
        ? `${u19RatingDisciplineLabel(discipline)} rating ${value}, U19 ${u19CircuitBandLabel(resolvedBand)}`
        : `${resolvedBand} rating ${display}`

  return (
    <span
      className={`inline-flex w-fit items-center justify-center border bg-white tabular-nums leading-none text-ink-900 shadow-[0_0_0_1px_var(--color-rating-chip-ring)] ${CHIP_SIZE_CLASS[size]}`}
      style={{ borderColor: INNER_COLOR[resolvedBand] }}
      title={accessible}
      aria-label={accessible}
    >
      {display}
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
