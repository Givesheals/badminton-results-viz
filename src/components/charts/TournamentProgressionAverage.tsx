import { useMemo } from 'react'
import {
  PROGRESSION_STAGE_COLORS,
  progressionBarDisplayWidths,
  progressionBarMarkerPercentFromTypicalRank,
  progressionBarMarkerRankForUI,
  progressionBarMobileLabel,
  type PrimaryComboProgression,
  type ProgressionDistributionRow,
} from '../../lib/tournamentProgression'

type Props = {
  primaryCombo: PrimaryComboProgression | null
}

function DistributionBar({
  segments,
  typicalRank,
}: {
  segments: ProgressionDistributionRow[]
  typicalRank: number
}) {
  const displayWidths = useMemo(() => progressionBarDisplayWidths(segments), [segments])
  const markerPercent = useMemo(
    () =>
      progressionBarMarkerPercentFromTypicalRank(
        progressionBarMarkerRankForUI(typicalRank),
        segments,
        displayWidths,
      ),
    [typicalRank, segments, displayWidths],
  )
  return (
    <div className="space-y-1.5">
      <div className="relative h-3 overflow-hidden rounded-full bg-white">
        <div className="flex h-full gap-px bg-white">
          {segments.map((row, index) => (
            <span
              key={row.stage}
              className={`h-full min-w-0 ${index === 0 ? 'rounded-l-full' : ''} ${
                index === segments.length - 1 ? 'rounded-r-full' : ''
              }`}
              style={{
                width: `${displayWidths[index] ?? 0}%`,
                backgroundColor: PROGRESSION_STAGE_COLORS[row.stage],
              }}
              title={`${row.label}: ${row.count} (${row.percent}%)`}
            />
          ))}
        </div>
        <span
          className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-600 shadow"
          style={{ left: `${markerPercent}%` }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-y-0 z-[1] w-0.5 -translate-x-1/2 bg-brand-700/35"
          style={{ left: `${markerPercent}%` }}
          aria-hidden
        />
      </div>
      <div className="flex w-full text-[10px] leading-tight text-ink-700 sm:text-xs">
        {segments.map((row, index) => {
          const displayWidth = displayWidths[index] ?? 0
          return (
            <span
              key={row.stage}
              className="min-w-0 px-0.5 text-center"
              style={{ width: `${displayWidth}%` }}
              title={`${row.label}: ${row.percent}%`}
            >
              <span className="block truncate md:hidden">
                {progressionBarMobileLabel(row.stage, displayWidth)}
              </span>
              <span className="hidden truncate md:block">{row.label}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function TournamentProgressionAverage({ primaryCombo }: Props) {
  if (
    primaryCombo == null ||
    primaryCombo.tournamentCount === 0 ||
    primaryCombo.typicalLabel == null ||
    primaryCombo.typicalRank == null
  ) {
    return (
      <p className="text-sm text-ink-700">
        Typical depth appears once you have at least one classified progression tournament.
      </p>
    )
  }

  const { label, typicalLabel, typicalRank, depthBarSegments, knockoutOrBetterPercent, tournamentCount } =
    primaryCombo

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-ink-900">Typical run</h4>
      <p className="text-center text-sm text-ink-700">
        <span className="font-medium text-ink-900">{label}</span>
        <span className="mt-0.5 block text-xs text-ink-500">
          Your most-played level and age — {tournamentCount}{' '}
          {tournamentCount === 1 ? 'event' : 'events'}
        </span>
      </p>
      <p className="text-center text-sm text-ink-700">
        <span className="font-medium text-ink-900">Median depth:</span> {typicalLabel}
        <span className="block text-xs text-ink-500">
          In a typical draw, 66% of players do not get past the group stages.
        </span>
      </p>
      {knockoutOrBetterPercent > 0 ? (
        <p className="text-center text-xs text-ink-500">
          Knockout or better in{' '}
          <span className="font-medium text-ink-700">{knockoutOrBetterPercent}%</span> of these
          events
        </p>
      ) : null}
      {depthBarSegments.length > 0 ? (
        <DistributionBar segments={depthBarSegments} typicalRank={typicalRank} />
      ) : null}
    </div>
  )
}
