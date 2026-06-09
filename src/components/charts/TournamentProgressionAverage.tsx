import { useMemo } from 'react'
import {
  PROGRESSION_STAGE_COLORS,
  progressionBarDisplayWidths,
  progressionBarMarkerPercentFromTypicalRank,
  progressionBarMarkerRankForUI,
  progressionBarMobileLabel,
  type ProgressionDistributionRow,
} from '../../lib/tournamentProgression'

type Props = {
  typicalLabel: string | null
  typicalRank: number | null
  bestLabel: string | null
  knockoutOrBetterPercent: number
  depthBarSegments: ProgressionDistributionRow[]
  tournamentCount: number
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

export function TournamentProgressionAverage({
  typicalLabel,
  typicalRank,
  bestLabel,
  knockoutOrBetterPercent,
  depthBarSegments,
  tournamentCount,
}: Props) {
  if (tournamentCount === 0 || typicalLabel == null || typicalRank == null) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-ink-700">
        Typical depth appears once you have at least one classified progression tournament.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {bestLabel != null ? (
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Personal best</p>
          <p className="mt-0.5 text-3xl font-semibold text-brand-700">{bestLabel}</p>
          {knockoutOrBetterPercent > 0 ? (
            <p className="mt-1 text-sm text-ink-700">
              Knockout or better in{' '}
              <span className="font-medium text-ink-900">{knockoutOrBetterPercent}%</span> of{' '}
              {tournamentCount} {tournamentCount === 1 ? 'tournament' : 'tournaments'}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-700">
              Across {tournamentCount} {tournamentCount === 1 ? 'tournament' : 'tournaments'} — keep
              pushing into the knockout rounds
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-center text-sm text-ink-700">
          <span className="font-medium text-ink-900">Median depth:</span> {typicalLabel}
          <span className="block text-xs text-ink-500">
            In a typical draw, 66% of players do not get past the group stages.
          </span>
        </p>
        {depthBarSegments.length > 0 ? (
          <DistributionBar segments={depthBarSegments} typicalRank={typicalRank} />
        ) : null}
      </div>
    </div>
  )
}
