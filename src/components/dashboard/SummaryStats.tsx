import type { DatasetStats } from '../../types/dataset'
import { formatCount, formatPercent } from '../../lib/formatNumbers'

type SummaryStatsProps = {
  stats: DatasetStats
}

export function SummaryStats({ stats }: SummaryStatsProps) {
  const totalPoints = stats.playerPoints + stats.opponentPoints

  const matchesWonValue =
    stats.matchWinPercent != null ? formatPercent(stats.matchWinPercent) : '—'
  const matchesWonDetail =
    stats.matchWins + stats.matchLosses > 0
      ? `(${formatCount(stats.matchWins)} wins)`
      : undefined

  const pointsWonValue =
    stats.pointsWinPercent != null ? formatPercent(stats.pointsWinPercent) : '—'
  const pointsWonDetail =
    totalPoints > 0
      ? `(${formatCount(stats.playerPoints)} / ${formatCount(totalPoints)})`
      : undefined

  const metrics = [
    { label: 'Matches played', value: formatCount(stats.matchesPlayed) },
    { label: 'Games played', value: formatCount(stats.gamesPlayed) },
    { label: 'Matches won', value: matchesWonValue, detail: matchesWonDetail },
    { label: 'Points won', value: pointsWonValue, detail: pointsWonDetail },
  ]

  return (
    <div
      className="grid cursor-default grid-cols-2 divide-x divide-y divide-ink-100 border-t border-ink-100 sm:grid-cols-4 sm:divide-y-0"
      role="group"
      aria-label="Summary statistics"
    >
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={`px-4 py-3 ${index >= 2 ? 'border-t border-ink-100 sm:border-t-0' : ''}`}
        >
          <p className="text-xs font-medium text-ink-500">{metric.label}</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-ink-900 sm:text-2xl">
            {metric.value}
          </p>
          {metric.detail && (
            <p className="mt-0.5 text-xs text-ink-500">{metric.detail}</p>
          )}
        </div>
      ))}
    </div>
  )
}
