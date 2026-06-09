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
}

export function PartnerHighlightCard({ row, onSelect, isSelected = false }: Props) {
  const chips = PROGRESSION_STAGE_CHIP_ORDER.filter(
    (stage) => (row.stageCounts[stage] ?? 0) > 0,
  )

  const className = [
    'w-full rounded-xl bg-white p-4 text-left shadow-sm transition',
    isSelected
      ? 'border border-brand-400 bg-brand-50/35 ring-2 ring-brand-100'
      : 'card-frame',
    onSelect != null
      ? 'cursor-pointer hover:border-brand-300 hover:bg-brand-50/20 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <h4 className="font-medium text-ink-900">{row.partnerName}</h4>
      <p className="mt-0.5 text-xs text-ink-500">
        {row.eventCount} event{row.eventCount === 1 ? '' : 's'} together
      </p>

      {chips.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {chips.map((stage) => (
            <StageChip key={stage} stage={stage} count={row.stageCounts[stage]!} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-600">No classified finishes in this selection.</p>
      )}

      {row.typicalLabel != null ? (
        <p className="mt-3 text-sm text-ink-600">
          Typical finish:{' '}
          <span className="font-medium text-ink-800">{row.typicalLabel}</span>
        </p>
      ) : null}
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
