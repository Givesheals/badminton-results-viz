import {
  formatStageChip,
  PROGRESSION_STAGE_CHIP_ORDER,
  type PartnerAchievementRow,
} from '../../lib/partnerAchievements'
import {
  isLightGroupProgressionStage,
  PROGRESSION_PARTNER_CHIP_COLORS,
  PROGRESSION_STAGE_COLORS,
  type ProgressionStage,
} from '../../lib/tournamentProgression'
import { AccordionChevron } from '../ui/AccordionChevron'

type Props = {
  row: PartnerAchievementRow
  expanded: boolean
  onToggle: () => void
  panelId?: string
}

export function PartnerHighlightCard({ row, expanded, onToggle, panelId }: Props) {
  const chips = PROGRESSION_STAGE_CHIP_ORDER.filter(
    (stage) => (row.stageCounts[stage] ?? 0) > 0,
  )

  const eventCountLabel = `${row.eventCount} event${row.eventCount === 1 ? '' : 's'} together`
  const toggleLabel = expanded
    ? `Hide tournament history for ${row.partnerName}`
    : `Show tournament history for ${row.partnerName}`

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition hover:bg-brand-50/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
      aria-expanded={expanded}
      aria-controls={panelId}
      aria-label={toggleLabel}
    >
      <div className="min-w-0 flex-1">
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
      </div>

      <AccordionChevron open={expanded} className="h-5 w-5" />
    </button>
  )
}

function StageChip({ stage, count }: { stage: ProgressionStage; count: number }) {
  const lightGroup = isLightGroupProgressionStage(stage)

  return (
    <li
      className={`rounded-full px-2.5 py-1 text-xs ${
        lightGroup
          ? 'font-medium text-black'
          : 'font-semibold text-white shadow-sm'
      }`}
      style={{
        backgroundColor:
          PROGRESSION_PARTNER_CHIP_COLORS[stage] ?? PROGRESSION_STAGE_COLORS[stage],
      }}
    >
      {formatStageChip(stage, count)}
    </li>
  )
}
