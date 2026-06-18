import {
  formatStageChip,
  PROGRESSION_STAGE_CHIP_ORDER,
  type PartnerAchievementRow,
} from '../../lib/partnerAchievements'
import {
  isLightGroupProgressionStage,
  PROGRESSION_STAGE_COLORS,
  type ProgressionStage,
} from '../../lib/tournamentProgression'

type Props = {
  row: PartnerAchievementRow
  onSelect?: () => void
  isSelected?: boolean
  variant?: 'standalone' | 'embedded'
}

export function PartnerHighlightCard({
  row,
  onSelect,
  isSelected = false,
  variant = 'standalone',
}: Props) {
  const chips = PROGRESSION_STAGE_CHIP_ORDER.filter(
    (stage) => (row.stageCounts[stage] ?? 0) > 0,
  )

  const isEmbedded = variant === 'embedded'

  const className = [
    'w-full p-4 text-left transition',
    isEmbedded
      ? isSelected
        ? 'bg-brand-50/35'
        : 'bg-white'
      : [
          'rounded-xl bg-white shadow-sm',
          isSelected
            ? 'border border-brand-400 bg-brand-50/35 ring-2 ring-brand-100'
            : 'card-frame',
        ].join(' '),
    onSelect != null
      ? isEmbedded
        ? 'cursor-pointer hover:bg-brand-50/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200'
        : 'cursor-pointer hover:border-brand-300 hover:bg-brand-50/20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const eventCountLabel = `${row.eventCount} event${row.eventCount === 1 ? '' : 's'} together`

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 font-medium text-ink-900">{row.partnerName}</h4>
        <p className="shrink-0 text-right text-xs text-ink-500">{eventCountLabel}</p>
      </div>

      {chips.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {chips.map((stage) => (
            <StageChip key={stage} stage={stage} count={row.stageCounts[stage]!} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-600">No classified finishes in this selection.</p>
      )}
    </>
  )

  if (onSelect != null) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={className}
        aria-pressed={isSelected}
        aria-label={`Show only ${row.partnerName}`}
      >
        {content}
      </button>
    )
  }

  return <article className={className}>{content}</article>
}

/** Group-stage swatches are very light — use a darker fill so white label text reads clearly. */
const GROUP_CHIP_COLOR = 'var(--color-ink-500)'

function StageChip({ stage, count }: { stage: ProgressionStage; count: number }) {
  const backgroundColor = isLightGroupProgressionStage(stage)
    ? GROUP_CHIP_COLOR
    : PROGRESSION_STAGE_COLORS[stage]

  return (
    <li
      className="rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
      style={{ backgroundColor }}
    >
      {formatStageChip(stage, count)}
    </li>
  )
}
